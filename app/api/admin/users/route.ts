// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { normalizePageSize } from "@/lib/pagination";
import { Role } from "@/app/(app)/generated/prisma/enums";

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
  // relation sorts: company.name and approver.name
  companyName: { type: "relation", key: "company", subKey: "name" },
  approverName: { type: "relation", key: "approver", subKey: "name" },
};

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

  // parse sort params
  const rawSortBy = (url.searchParams.get("sortBy") || DEFAULT_SORT.sortBy).trim();
  const rawSortDir = (url.searchParams.get("sortDir") || DEFAULT_SORT.sortDir).toLowerCase();
  const sortDir = rawSortDir === "asc" ? "asc" : "desc";

  // build where
  const where: any = {};
  if (companyFilter) where.companyId = companyFilter;
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
  ];

  // map sort
  const mapped = ALLOWED_SORT_MAP[rawSortBy] ?? ALLOWED_SORT_MAP[DEFAULT_SORT.sortBy];

  // build safe orderBy
  let orderBy: any;
  if (mapped.type === "relation") {
    // e.g. { company: { name: 'asc' } }
    orderBy = { [mapped.key]: { [mapped.subKey as string]: sortDir } };
  } else {
    // e.g. { createdAt: 'desc' }
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
