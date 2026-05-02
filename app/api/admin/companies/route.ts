// app/api/admin/companies/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { normalizePageSize } from "@/lib/pagination";
import { Role } from "@/app/(app)/generated/prisma/enums";

const DEFAULT_SORT = { sortBy: "createdAt", sortDir: "desc" } as const;

/**
 * Describe how each client-visible column maps to a safe DB orderBy.
 * - type: "field" => orderBy: { [field]: dir }
 * - type: "count" => orderBy: { _count: { [relation]: dir } }
 */
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
