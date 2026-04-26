import { z } from "zod"
import { Role } from "@/app/(app)/generated/prisma/enums"

export const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  // transform empty string -> undefined, then require min 6 if present
  password: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() === "") return undefined
    return val
  }, z.string().min(6, "Password must be at least 6 characters").optional()),
  companyId: z.string(),
  role: z.nativeEnum(Role),
  approverId: z.string().nullable().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
