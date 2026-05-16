// app/api/companies/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/app/(app)/generated/prisma/enums";

/**
 * NOTE
 * Rate limiting has been removed from this handler.
 * For production, consider adding a distributed rate limiter (Redis/Upstash or a library)
 */

export async function PATCH(req: NextRequest, context: any) {
  try {
    // Extract route params (compatible with App Router route handlers)
    const resolvedContext = await context;
    const params = await resolvedContext?.params;
    const companyId = params?.id;
    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ message: "Missing route parameter: id" }, { status: 400 });
    }

    // Auth: require a valid session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admins may toggle company active status
    const actorRole = session.user.role as string | undefined;
    if (actorRole !== Role.ADMIN) {
      return NextResponse.json({ message: "Only admins can change company active status" }, { status: 403 });
    }

    // Parse body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const isActive = body?.isActive;
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ message: "Missing or invalid isActive boolean" }, { status: 400 });
    }

    // Transactional checks + update to avoid TOCTOU
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { id: true, isActive: true },
      });

      if (!company) {
        return { status: 404, body: { message: "Company not found" } };
      }

      // If deactivating: prevent if company has any active users
      if (isActive === false) {
        const activeUsers = await tx.user.count({
          where: { companyId: companyId, isActive: true },
        });

        if (activeUsers > 0) {
          return {
            status: 400,
            body: {
              message:
                "Cannot deactivate company while it has active users. Deactivate or reassign users first",
            },
          };
        }
      }

      // Update company active flag
      const updated = await tx.company.update({
        where: { id: companyId },
        data: { isActive },
      });

      return { status: 200, body: { success: true, updated } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error("company toggle-active error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
