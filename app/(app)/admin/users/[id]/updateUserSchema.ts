// src/schemas/updateUserSchema.ts
import { z } from "zod";
import { Role } from "@/app/(app)/generated/prisma/enums";

export const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  // preprocess empty string -> undefined, inner schema optional to accept undefined
  password: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const trimmed = val.trim();
        return trimmed === "" ? undefined : trimmed;
      }
      return val;
    },
    z.string().min(6, "Password must be at least 6 characters").optional()
  ),
  // allow null when client sends `null` for "no company"
  companyId: z.string().nullable(),
  role: z.nativeEnum(Role),
  approverId: z.string().nullable().optional(),
  // add isActive as optional boolean
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
