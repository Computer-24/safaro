"use server"

import bcrypt from "bcryptjs"
import { createUserSchema } from "./schema"
import { prisma } from "@/lib/prisma"

export async function createUserAction(values: unknown) {
  const parsed = createUserSchema.safeParse(values)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existing) {
    return { error: { email: ["Email already exists"] } }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      approverId: data.approverId || null,
    }
  })

  return { success: true }
}
