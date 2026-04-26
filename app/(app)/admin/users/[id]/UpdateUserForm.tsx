"use client"

import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateUserSchema, type UpdateUserInput } from "./updateUserSchema"
import { updateUserAction } from "./updateUserAction"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import { RoleEnum } from "../create/schema"
import { Role } from "@/app/(app)/generated/prisma/enums"

type CompanyOption = { id: string; name: string }
type ApproverOption = { id: string; name: string }

interface UpdateUserFormProps {
  user: {
    id: string
    name: string
    email: string
    companyId: string
    role: Role
    approverId: string | null
  }
  companies: CompanyOption[]
  approvers: ApproverOption[]
}

export default function UpdateUserForm({
  user,
  companies,
  approvers,
}: UpdateUserFormProps) {
  const router = useRouter()

  // typed resolver to avoid zod/preprocess inference mismatch
  const resolver = zodResolver(updateUserSchema) as unknown as Resolver<
    UpdateUserInput,
    any
  >

  const form = useForm<UpdateUserInput>({
    resolver,
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      companyId: user.companyId,
      role: user.role,
      approverId: user.approverId,
    },
  })

  const fieldClass = "h-[44px] min-h-[44px] w-full"
  const buttonHeight = "h-[44px] min-h-[44px]"
  const errorText = "text-sm text-red-500"

  async function onSubmit(values: UpdateUserInput) {
    toast.dismiss()

    try {
      const result = await updateUserAction(values)

      if (!result.success) {
        const errorMap = result.error

        if (typeof errorMap.subordinates === "number") {
          toast.error(
            `⛔ ${errorMap._global?.[0] ?? "Cannot change role"} (${errorMap.subordinates} subordinate(s) must be reassigned)`
          )
        } else if (Array.isArray(errorMap._global)) {
          toast.error(`⚠️ ${errorMap._global[0]}`)
        } else {
          toast.error("⚠️ Could not update user")
        }

        Object.entries(errorMap).forEach(([field, messages]) => {
          if (field === "_global" || field === "subordinates") return
          form.setError(field as any, { message: messages[0] })
        })

        return
      }

      toast.success("🎉 User updated successfully")
      router.push("/admin/users")
    } catch (err) {
      console.error(err)
      toast.error("⚠️ Unexpected error while updating user")
    }
  }

  return (
    <div className="flex justify-center py-10">
      <Card className="w-full max-w-lg shadow-md pb-8">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Edit User
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* NAME */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} className={fieldClass} />
              {form.formState.errors.name && (
                <p className={errorText}>{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...form.register("email")} className={fieldClass} />
              {form.formState.errors.email && (
                <p className={errorText}>{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>New Password (optional)</Label>
              <Input
                type="password"
                {...form.register("password")}
                className={fieldClass}
              />
              {form.formState.errors.password && (
                <p className={errorText}>{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* COMPANY */}
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                defaultValue={user.companyId}
                onValueChange={(v) => form.setValue("companyId", v)}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.companyId && (
                <p className={errorText}>{form.formState.errors.companyId.message}</p>
              )}
            </div>

            {/* ROLE */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                defaultValue={String(user.role)}
                onValueChange={(v) => form.setValue("role", v as any)}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {RoleEnum.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className={errorText}>{form.formState.errors.role.message}</p>
              )}
            </div>

            {/* APPROVER */}
            <div className="space-y-2">
              <Label>Approver</Label>
              <Select
                defaultValue={user.approverId ?? undefined}
                onValueChange={(v) => form.setValue("approverId", v)}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  {approvers.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.approverId && (
                <p className={errorText}>{form.formState.errors.approverId.message}</p>
              )}
            </div>

            {/* BUTTONS: wrapper prevents space-y from interfering */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 min-w-0 ${buttonHeight} text-base border-red-400 text-red-600 hover:bg-red-50`}
                  onClick={() => router.push("/admin/users")}
                >
                  ✖ Cancel
                </Button>

                <Button
                  type="submit"
                  className={`flex-1 min-w-0 ${buttonHeight} text-base`}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : "🎉 Save Changes"}
                </Button>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
