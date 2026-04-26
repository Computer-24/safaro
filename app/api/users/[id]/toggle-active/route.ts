// app/api/users/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";

export async function PATCH(req: NextRequest, context: any) {
  try {
    const resolvedContext = await context;
    const params = await resolvedContext?.params;
    const userId = params?.id;

    if (!userId) {
      return NextResponse.json(
        { message: "Missing route parameter: id" },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const isActive = body?.isActive;
    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "Missing or invalid isActive boolean" },
        { status: 400 }
      );
    }

    // Fetch user with role + company status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        company: { select: { isActive: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ❌ SAFETY RULE 1: Admins cannot be deactivated
    if (user.role === Role.ADMIN && isActive === false) {
      return NextResponse.json(
        { message: "Admins cannot be deactivated." },
        { status: 403 }
      );
    }

    // ❌ SAFETY RULE 2: Approver cannot be deactivated if they have subordinates
    if (user.role === Role.APPROVER && isActive === false) {
      const subordinates = await prisma.user.count({
        where: { approverId: userId },
      });

      if (subordinates > 0) {
        return NextResponse.json(
          { message: "This approver has subordinates and cannot be deactivated." },
          { status: 400 }
        );
      }
    }

    // ❌ SAFETY RULE 3: User cannot be activated if their company is inactive
    if (isActive === true && user.company.isActive === false) {
      return NextResponse.json(
        { message: "Cannot activate a user whose company is inactive." },
        { status: 400 }
      );
    }

    // Update status
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("toggle-active error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
