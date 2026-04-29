"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@/app/(app)/generated/prisma/enums"
import { updateUserSchema } from "./updateUserSchema"

type ActionResult =
  | { success: true }
  | { success: false; error: Record<string, any> }

const NONE_VALUE = "__none" // sentinel used by client Select

export async function updateUserAction(values: unknown): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }
  const data = parsed.data

  // Defensive normalization of approverId
  let approverId: string | null =
    data.approverId === NONE_VALUE ? null : (data.approverId ?? null)
  if (typeof approverId === "string" && approverId.trim() === "") approverId = null
  if (approverId && approverId === data.id) {
    // ignore self-approver assignment
    approverId = null
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: data.id },
        select: { email: true, role: true },
      })
      if (!existingUser) {
        return { __error: { _global: ["User not found"] } }
      }

      // Prevent removing the last ADMIN
      if (existingUser.role === Role.ADMIN && data.role !== Role.ADMIN) {
        const adminCount = await tx.user.count({ where: { role: Role.ADMIN } })
        if (adminCount <= 1) {
          return {
            __error: {
              _global: ["Cannot remove the last admin. At least one admin must remain."],
              admins: adminCount,
            },
          }
        }
      }

      // Prevent Approver -> User if subordinates exist
      if (existingUser.role === Role.APPROVER && data.role === Role.USER) {
        const subordinates = await tx.user.count({ where: { approverId: data.id } })
        if (subordinates > 0) {
          return {
            __error: {
              _global: [
                `Cannot change role: this approver has ${subordinates} subordinate(s). Reassign them first.`,
              ],
              subordinates,
            },
          }
        }
      }

      // Email uniqueness check only if changed
      if (existingUser.email !== data.email) {
        const emailExists = await tx.user.findUnique({ where: { email: data.email } })
        if (emailExists) {
          return { __error: { email: ["Email already exists"] } }
        }
      }

      // Validate company
      const company = await tx.company.findUnique({
        where: { id: data.companyId },
        select: { isActive: true },
      })
      if (!company || !company.isActive) {
        return { __error: { companyId: ["Selected company is not active or does not exist"] } }
      }

      // Validate approver using the normalized approverId
      if (approverId) {
        const approver = await tx.user.findUnique({
          where: { id: approverId },
          select: { isActive: true, role: true, approverId: true },
        })
        if (!approver || !approver.isActive || approver.role !== Role.APPROVER) {
          return { __error: { approverId: ["Selected approver is not an active approver or does not exist"] } }
        }

        // Cycle detection: walk the approver chain starting from the candidate approver.
        // If we encounter the user being edited, assigning this approver would create a cycle.
        // Use a Set to avoid infinite loops on pre-existing cycles.
        // inside the transaction, where you do cycle detection
        let current: string | null = approverId
        const seen = new Set<string>()

        while (current) {
          if (current === data.id) {
            return { __error: { approverId: ["Cannot assign this approver because it would make User A and User B approvers of each other"] } }
          }
          if (seen.has(current)) break
          seen.add(current)

          // give the DB row an explicit type so TS doesn't infer `any`
          const row = await tx.user.findUnique({
            where: { id: current },
            select: { approverId: true },
          }) as { approverId: string | null } | null

          current = row?.approverId ?? null
        }

      }

      // Hash password only if provided
      let hashedPassword: string | undefined
      if (data.password) hashedPassword = await bcrypt.hash(data.password, 10)

      await tx.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          companyId: data.companyId,
          role: data.role,
          approverId: approverId,
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
      })

      return { success: true }
    })

    if ((result as any).__error) {
      return { success: false, error: (result as any).__error }
    }
    return { success: true }
  } catch (err) {
    console.error("updateUserAction error:", err)
    return { success: false, error: { _global: ["Unable to update user. Please try again."] } }
  }
}
