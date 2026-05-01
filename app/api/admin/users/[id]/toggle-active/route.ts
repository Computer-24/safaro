// app/api/users/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * NOTE: This implementation requires:
 * - next-auth session available via getServerSession(authOptions)
 * - (optional) AuditLog model in Prisma for audit entries
 *
 * Policy enforced here:
 * - Only ADMINs can perform activation or deactivation.
 * - Admins cannot deactivate users with role ADMIN.
 * - All checks + update run inside a transaction to avoid TOCTOU.
 * - Subordinate counts are scoped to active subordinates.
 * - Lightweight in-memory rate limiter (single-process). Replace with Redis/Upstash for production.
 */

/* Lightweight in-memory rate limiter (single-process). Replace with shared store in prod. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
if (!(global as any).__userToggleRateMap) {
  (global as any).__userToggleRateMap = new Map<string, number[]>();
}
const rateMap: Map<string, number[]> = (global as any).__userToggleRateMap;
function isRateLimited(key: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = rateMap.get(key) ?? [];
  const recent = hits.filter((t) => t > windowStart);
  recent.push(now);
  rateMap.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function PATCH(req: NextRequest, context: any) {
  try {
    const resolvedContext = await context;
    const params = await resolvedContext?.params;
    const userId = params?.id;

    if (!userId) {
      return NextResponse.json({ message: "Missing route parameter: id" }, { status: 400 });
    }

    // Auth: require a valid session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Rate limit by actor id
    const actorId = session.user.id as string;
    const actorKey = `actor:${actorId}`;
    if (isRateLimited(actorKey)) {
      return NextResponse.json({ message: "Too many requests" }, { status: 429 });
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

    const actorRole = session.user.role as string | undefined;

    // Policy: Only ADMINs can perform activation or deactivation
    if (actorRole !== Role.ADMIN) {
      return NextResponse.json({ message: "Only admins can change user active status." }, { status: 403 });
    }

    // Transactional checks + update to avoid TOCTOU
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          companyId: true,
          isActive: true,
        },
      });

      if (!user) {
        return { status: 404, body: { message: "User not found" } };
      }

      // New rule: Admins cannot be deactivated (target role ADMIN)
      if (isActive === false && user.role === Role.ADMIN) {
        return { status: 403, body: { message: "Cannot deactivate a user with ADMIN role" } };
      }

      // SAFETY: Approver cannot be deactivated if they have active subordinates
      if (user.role === Role.APPROVER && isActive === false) {
        const activeSubs = await tx.user.count({
          where: { approverId: userId, isActive: true },
        });

        if (activeSubs > 0) {
          return {
            status: 400,
            body: { message: "This approver has active subordinates and cannot be deactivated" },
          };
        }
      }

      // SAFETY: Prevent activating a user whose company is inactive
      if (isActive === true) {
        const company = await tx.company.findUnique({
          where: { id: user.companyId },
          select: { isActive: true },
        });

        if (!company) {
          return { status: 400, body: { message: "User's company not found." } };
        }

        if (company.isActive === false) {
          return { status: 400, body: { message: "Cannot activate a user whose company is inactive" } };
        }
      }

      // SAFETY: Prevent deactivating the last active admin in the company
      // (defensive; with current policy admins cannot be deactivated, but keep check for other flows)
      if (isActive === false && user.role === Role.ADMIN) {
        const activeAdmins = await tx.user.count({
          where: { companyId: user.companyId, role: Role.ADMIN, isActive: true },
        });

        if (activeAdmins <= 1) {
          return { status: 400, body: { message: "Cannot deactivate the last active admin for the company" } };
        }
      }

      // Perform update
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive },
      });

      return { status: 200, body: { success: true, updated } };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    console.error("toggle-active error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
