// app/api/admin/companies/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(2).max(100),
});

export async function PUT(req: Request, context: any) {
  const resolvedParams = await context.params;
  const companyId = resolvedParams?.id;
  if (!companyId) return NextResponse.json({ message: "Missing company id" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (session.user.role !== Role.ADMIN) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  let payload;
  try {
    const json = await req.json();
    payload = bodySchema.parse(json);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Invalid request" }, { status: 400 });
  }

  try {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { name: payload.name },
      select: { id: true, name: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ company: updated });
  } catch (err) {
    console.error("PUT /api/admin/companies/:id error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
