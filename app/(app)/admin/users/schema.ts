import { z } from "zod"

// Safe enum for client-side use
export const RoleEnum = ["USER", "APPROVER", "ADMIN"] as const

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyId: z.string().min(1, "Company is required"),
  role: z.enum(RoleEnum),
  approverId: z.string().nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
