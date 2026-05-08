// app/api/admin/users/route.ts
import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { normalizePageSize } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const DEFAULT_SORT = { sortBy: "createdAt", sortDir: "desc" } as const;

/**
 * Map client-visible column ids to safe Prisma order descriptors.
 * type: "field" => orderBy: { [field]: dir }
 * type: "relation" => orderBy: { [relation]: { [field]: dir } }
 */
const ALLOWED_SORT_MAP: Record<
  string,
  { type: "field" | "relation"; key: string; subKey?: string }
> = {
  name: { type: "field", key: "name" },
  email: { type: "field", key: "email" },
  role: { type: "field", key: "role" },
  isActive: { type: "field", key: "isActive" },
  createdAt: { type: "field", key: "createdAt" },
  companyName: { type: "relation", key: "company", subKey: "name" },
  approverName: { type: "relation", key: "approver", subKey: "name" },
};

function formatZodErrors(flattened: Record<string, any>) {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(flattened)) {
    if (Array.isArray(v)) out[k] = v.map(String);
    else out[k] = [String(v)];
  }
  return out;
}

/**
 * Zod schema for creating a user.
 * - password is required
 * - companyId is required (non-nullable)
 * - approverId may be null/optional
 */
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  role: z.nativeEnum(Role),
  companyId: z.string().min(1, "Company is required"),
  approverId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = normalizePageSize(Number(url.searchParams.get("pageSize")));
  const companyFilter = url.searchParams.get("company") || undefined;
  const q = url.searchParams.get("q") || undefined;

  const rawSortBy = (url.searchParams.get("sortBy") || DEFAULT_SORT.sortBy).trim();
  const rawSortDir = (url.searchParams.get("sortDir") || DEFAULT_SORT.sortDir).toLowerCase();
  const sortDir = rawSortDir === "asc" ? "asc" : "desc";

  const where: any = {};
  if (companyFilter) where.companyId = companyFilter;
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
  ];

  const mapped = ALLOWED_SORT_MAP[rawSortBy] ?? ALLOWED_SORT_MAP[DEFAULT_SORT.sortBy];

  let orderBy: any;
  if (mapped.type === "relation") {
    orderBy = { [mapped.key]: { [mapped.subKey as string]: sortDir } };
  } else {
    orderBy = { [mapped.key]: sortDir };
  }

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          company: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
      meta: {
        total,
        page,
        pageSize,
        sort: { requested: rawSortBy, sortDir, applied: mapped },
      },
    });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    // Normalize empty strings to null for approver only
    if (body.approverId === "") body.approverId = null;

    // Validate input using the create schema (companyId and password required)
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ success: false, error: formatZodErrors(flattened) }, { status: 422 });
    }
    const data = parsed.data;

    // Basic uniqueness check for email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ success: false, error: { email: ["Email already exists"] } }, { status: 422 });
    }

    // Validate company and approver inside a transaction to avoid race conditions and create the user
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Ensure company exists and is active (companyId is required)
        const company = await tx.company.findUnique({
          where: { id: data.companyId },
          select: { id: true, isActive: true },
        });

        if (!company || !company.isActive) {
          return { __error: { companyId: ["Selected company is not active or does not exist"] } };
        }

        // If approverId provided, ensure approver exists, is active and has APPROVER role
        if (data.approverId) {
          const approver = await tx.user.findUnique({
            where: { id: data.approverId },
            select: { id: true, role: true, isActive: true },
          });

          if (!approver || !approver.isActive || approver.role !== Role.APPROVER) {
            return { __error: { approverId: ["Selected approver is not an active approver or does not exist"] } };
          }
        }

        // Hash password (password is mandatory here)
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create the user
        const created = await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
            companyId: data.companyId,
            approverId: data.approverId ?? undefined,
            isActive: data.isActive ?? true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            company: { select: { id: true, name: true } },
            approver: { select: { id: true, name: true } },
            createdAt: true,
          },
        });

        return { success: true, user: created };
      });

      if ((result as any).__error) {
        return NextResponse.json({ success: false, error: (result as any).__error }, { status: 422 });
      }

      const createdUser = (result as any).user;
      if (createdUser?.createdAt instanceof Date) {
        createdUser.createdAt = createdUser.createdAt.toISOString();
      }

      return NextResponse.json({ success: true, user: createdUser }, { status: 201 });
    } catch (err) {
      console.error("POST /api/admin/users transaction error:", err);
      if ((err as any)?.code === "P2002" && (err as any)?.meta?.target?.includes("email")) {
        return NextResponse.json({ success: false, error: { email: ["Email already exists"] } }, { status: 409 });
      }
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
