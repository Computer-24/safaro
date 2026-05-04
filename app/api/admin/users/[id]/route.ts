// app/api/admin/users/[id]/route.ts
import { updateUserSchema } from "@/app/(app)/admin/users/[id]/updateUserSchema";
import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const NONE_VALUE = "__none";

function formatZodErrors(flattened: Record<string, any>) {
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(flattened)) {
        if (Array.isArray(v)) out[k] = v.map(String);
        else out[k] = [String(v)];
    }
    return out;
}

export async function PUT(req: NextRequest, context: any) {
    try {
        const resolvedContext = await context;
        const params = await resolvedContext?.params;
        const userId = params?.id;
        if (!userId) {
            return NextResponse.json({ message: "Missing route parameter: id" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const actorId = session.user.id as string;
        const actorRole = session.user.role as string | undefined;

        // parse body
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
        }

        // Defensive: ensure route id and body id match (if body.id provided)
        if (body?.id && body.id !== userId) {
            return NextResponse.json({ message: "Mismatched id in body" }, { status: 400 });
        }

        // Permission: only admins or the user themself can update
        if (actorRole !== Role.ADMIN && actorId !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // If non-admin tries to change restricted fields, block
        if (actorRole !== Role.ADMIN) {
            if (body.role !== undefined || body.companyId !== undefined || typeof body.isActive === "boolean") {
                return NextResponse.json({ message: "Only admins can change role/company/active status" }, { status: 403 });
            }
        }

        // Merge route id into payload so schema has id
        const payload = { ...body, id: userId };

        // Validate with zod schema (schema should preprocess empty password -> undefined)
        const parsed = updateUserSchema.safeParse(payload);
        if (!parsed.success) {
            const flattened = parsed.error.flatten().fieldErrors;
            return NextResponse.json({ success: false, error: formatZodErrors(flattened) }, { status: 422 });
        }
        const data = parsed.data;

        // Normalize approverId sentinel and empty strings
        let approverId: string | null =
            data.approverId === NONE_VALUE ? null : (data.approverId ?? null);
        if (typeof approverId === "string" && approverId.trim() === "") approverId = null;
        if (approverId && approverId === data.id) approverId = null;

        // Run transactional checks and update
        const txResult = await prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({
                where: { id: data.id },
                select: { email: true, role: true, companyId: true },
            });

            if (!existingUser) {
                return { __error: { _global: ["User not found"] } };
            }

            // Prevent removing the last ADMIN
            if (existingUser.role === Role.ADMIN && data.role !== Role.ADMIN) {
                const adminCount = await tx.user.count({ where: { role: Role.ADMIN } });
                if (adminCount <= 1) {
                    return {
                        __error: {
                            _global: ["Cannot remove the last admin. At least one admin must remain."],
                            admins: adminCount,
                        },
                    };
                }
            }

            // Prevent Approver -> User if subordinates exist
            if (existingUser.role === Role.APPROVER && data.role === Role.USER) {
                const subordinates = await tx.user.count({ where: { approverId: data.id } });
                if (subordinates > 0) {
                    return {
                        __error: {
                            _global: [
                                `Cannot change role: this approver has ${subordinates} subordinate(s). Reassign them first.`,
                            ],
                            subordinates,
                        },
                    };
                }
            }

            // Email uniqueness check only if changed
            if (existingUser.email !== data.email) {
                const emailExists = await tx.user.findUnique({ where: { email: data.email } });
                if (emailExists) {
                    return { __error: { email: ["Email already exists"] } };
                }
            }

            // Validate company exists and is active only when a companyId string is provided
            if (typeof data.companyId === "string" && data.companyId.trim() !== "") {
                const company = await tx.company.findUnique({
                    where: { id: data.companyId },
                    select: { isActive: true },
                });
                if (!company || !company.isActive) {
                    return { __error: { companyId: ["Selected company is not active or does not exist"] } };
                }
            }

            // Validate approver if provided
            if (approverId) {
                const approver = await tx.user.findUnique({
                    where: { id: approverId },
                    select: { isActive: true, role: true, approverId: true },
                });
                if (!approver || !approver.isActive || approver.role !== Role.APPROVER) {
                    return { __error: { approverId: ["Selected approver is not an active approver or does not exist"] } };
                }

                // Cycle detection
                let current: string | null = approverId;
                const seen = new Set<string>();
                while (current) {
                    if (current === data.id) {
                        return { __error: { approverId: ["Cannot assign this approver because it would create a cycle"] } };
                    }
                    if (seen.has(current)) break;
                    seen.add(current);

                    const row = await tx.user.findUnique({
                        where: { id: current },
                        select: { approverId: true },
                    }) as { approverId: string | null } | null;

                    current = row?.approverId ?? null;
                }
            }

            // Hash password only if provided (schema preprocess makes empty -> undefined)
            let hashedPassword: string | undefined;
            if (typeof data.password === "string" && data.password.trim().length > 0) {
                hashedPassword = await bcrypt.hash(data.password, 10);
            }

            // Build update payload safely for Prisma
            const updatePayload: any = {
                name: data.name,
                email: data.email,
                role: data.role,
            };

            // Include approverId explicitly: allow null to remove approver if DB allows it
            if (approverId === null) {
                updatePayload.approverId = null;
            } else if (typeof approverId === "string") {
                updatePayload.approverId = approverId;
            }

            // Only include companyId when it's a non-empty string (avoid passing null if DB column is non-nullable)
            if (typeof data.companyId === "string" && data.companyId.trim() !== "") {
                updatePayload.companyId = data.companyId;
            }

            // Include password only when hashed
            if (hashedPassword) updatePayload.password = hashedPassword;

            await tx.user.update({
                where: { id: data.id },
                data: updatePayload,
            });

            return { success: true };
        });

        if ((txResult as any).__error) {
            return NextResponse.json({ success: false, error: (txResult as any).__error }, { status: 422 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("PUT /api/admin/users/[id] error:", err);
        // Prisma unique constraint mapping example
        if (err?.code === "P2002" && err?.meta?.target?.includes("email")) {
            return NextResponse.json({ success: false, error: { email: ["Email already exists"] } }, { status: 409 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
