// app/api/admin/companies/[id]/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: any) {
  // unwrap params (context.params may be a Promise in this environment)
  const resolvedParams = await context.params;
  const companyId = resolvedParams?.id;

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!companyId) {
    return NextResponse.json({ message: "Missing company id" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { companyId }, // fetch users for the company
    include: { company: true, approver: true },
    orderBy: { createdAt: "desc" },
  });

  const mapped = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company: u.company ? { name: u.company.name } : null,
    approver: u.approver ? { name: u.approver.name } : null,
    createdAt: u.createdAt.toISOString(),
    isActive: u.isActive,
  }));

  return NextResponse.json({ users: mapped });
}
