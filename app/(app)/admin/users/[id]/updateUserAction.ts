"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@/app/(app)/generated/prisma/enums"
import { updateUserSchema } from "./updateUserSchema"

type ActionResult =
  | { success: true }
  | { success: false; error: Record<string, any> }

export async function updateUserAction(values: unknown): Promise<ActionResult> {
  const parsed = updateUserSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }
  const data = parsed.data

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: data.id },
        select: { email: true, role: true },
      })
      if (!existingUser) {
        return { __error: { _global: ["User not found"] } }
      }

      // NEW SAFEGUARD: Prevent removing the last ADMIN
      // If the existing user is ADMIN and the update would remove ADMIN role,
      // ensure there is more than one admin in the system.
      if (existingUser.role === Role.ADMIN && data.role !== Role.ADMIN) {
        const adminCount = await tx.user.count({
          where: { role: Role.ADMIN },
        })

        if (adminCount <= 1) {
          return {
            __error: {
              _global: [
                "Cannot remove the last admin. At least one admin must remain.",
              ],
              admins: adminCount,
            },
          }
        }
      }

      // SAFEGUARD: Prevent Approver -> User if subordinates exist
      if (existingUser.role === Role.APPROVER && data.role === Role.USER) {
        const subordinates = await tx.user.count({
          where: { approverId: data.id },
        })
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
        const emailExists = await tx.user.findUnique({
          where: { email: data.email },
        })
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

      // Validate approver
      if (data.approverId) {
        const approver = await tx.user.findUnique({
          where: { id: data.approverId },
          select: { isActive: true, role: true },
        })
        if (!approver || !approver.isActive || approver.role !== Role.APPROVER) {
          return { __error: { approverId: ["Selected approver is not an active approver or does not exist"] } }
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
          approverId: data.approverId || null,
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
