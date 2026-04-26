"use server";

import bcrypt from "bcryptjs";
import { createUserSchema } from "./schema";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";

export async function createUserAction(values: unknown) {
  const parsed = createUserSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Basic uniqueness check for email
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { error: { email: ["Email already exists"] } };
  }

  // Validate company and approver inside a transaction to avoid race conditions
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ensure company exists and is active
      const company = await tx.company.findUnique({
        where: { id: data.companyId },
        select: { id: true, isActive: true },
      });

      if (!company || !company.isActive) {
        // return a sentinel object to indicate failure
        return { __error: { companyId: ["Selected company is not active"] } };
      }

      // If approverId provided, ensure approver exists, is active and has APPROVER role
      if (data.approverId) {
        const approver = await tx.user.findUnique({
          where: { id: data.approverId },
          select: { id: true, role: true, isActive: true },
        });

        if (!approver || !approver.isActive || approver.role !== Role.APPROVER) {
          return { __error: { approverId: ["Selected approver is not an active approver"] } };
        }
      }

      // All checks passed; create the user
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const created = await tx.user.create({
        data: {
          ...data,
          password: hashedPassword,
          approverId: data.approverId || null,
        },
      });

      return { created };
    });

    // If transaction returned an error sentinel, forward it
    if ((result as any).__error) {
      return { error: (result as any).__error };
    }

    return { success: true };
  } catch (err) {
    // Log server-side error as needed, then return a generic error shape
    console.error("createUserAction error:", err);
    return { error: { _global: ["Unable to create user. Please try again."] } };
  }
}
