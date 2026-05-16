// app/api/admin/companies/route.ts
import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { normalizePageSize } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const DEFAULT_SORT = { sortBy: "createdAt", sortDir: "desc" } as const;
const ALLOWED_SORT_MAP: Record<
  string,
  { type: "field" | "count"; key: string }
> = {
  name: { type: "field", key: "name" },
  createdAt: { type: "field", key: "createdAt" },
  isActive: { type: "field", key: "isActive" },
  // client column id -> relation name for counts
  employeesCount: { type: "count", key: "users" },
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
 * Schema for creating a company.
 * - name is required
 * - isActive optional (defaults to true)
 */
const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
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

  // parse and normalize sort params, falling back to DEFAULT_SORT
  const rawSortBy = (url.searchParams.get("sortBy") || DEFAULT_SORT.sortBy).trim();
  const rawSortDir = (url.searchParams.get("sortDir") || DEFAULT_SORT.sortDir).toLowerCase();
  const sortDir = rawSortDir === "asc" ? "asc" : "desc";

  // debug log: what the client requested
  console.debug("GET /api/admin/companies sort request:", { rawSortBy, sortDir });

  // map client column id to a safe descriptor
  const mapped = ALLOWED_SORT_MAP[rawSortBy] ?? ALLOWED_SORT_MAP[DEFAULT_SORT.sortBy];

  // build a safe orderBy for Prisma
  let orderBy: any;
  if (mapped.type === "count") {
    // Prisma expects the relation name as the key, with _count nested:
    // { users: { _count: 'desc' } }
    orderBy = { [mapped.key]: { _count: sortDir } };
  } else {
    // e.g. { createdAt: 'desc' }
    orderBy = { [mapped.key]: sortDir };
  }

  try {
    const [companies, total] = await prisma.$transaction([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          _count: { select: { users: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.company.count(),
    ]);

    return NextResponse.json({
      companies: companies.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      meta: {
        total,
        page,
        pageSize,
        sort: { sortBy: rawSortBy, sortDir, applied: mapped },
      },
    });
  } catch (err) {
    // log full error for debugging
    if (err instanceof Error) {
      console.error("GET /api/admin/companies error:", err.message, err.stack);
    } else {
      console.error("GET /api/admin/companies unknown error:", err);
    }
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

    // Validate input
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ success: false, error: formatZodErrors(flattened) }, { status: 422 });
    }
    const data = parsed.data;

    // Uniqueness check and create inside a transaction to avoid races
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.company.findUnique({ where: { name: data.name } });
        if (existing) {
          return { __error: { name: ["Company with this name already exists"] } };
        }

        const created = await tx.company.create({
          data: {
            name: data.name,
            isActive: data.isActive ?? true,
          },
          select: { id: true, name: true, isActive: true, createdAt: true },
        });

        return { success: true, company: created };
      });

      if ((result as any).__error) {
        return NextResponse.json({ success: false, error: (result as any).__error }, { status: 422 });
      }

      const createdCompany = (result as any).company;
      if (createdCompany?.createdAt instanceof Date) {
        createdCompany.createdAt = createdCompany.createdAt.toISOString();
      }

      return NextResponse.json({ success: true, company: createdCompany }, { status: 201 });
    } catch (err: any) {
      console.error("POST /api/admin/companies transaction error:", err);
      if (err?.code === "P2002" && err?.meta?.target?.includes("name")) {
        return NextResponse.json({ success: false, error: { name: ["Company with this name already exists"] } }, { status: 409 });
      }
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("POST /api/admin/companies error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
