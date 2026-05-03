"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { toast } from "sonner"

import { updateUserAction } from "./updateUserAction"
import { updateUserSchema, type UpdateUserInput } from "./updateUserSchema"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Role } from "@/app/(app)/generated/prisma/enums"
import { RoleEnum } from "../create/schema"

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
  excludeUserId?: string | null
}
const NONE_VALUE = "__none"

export default function UpdateUserForm({
  user,
  companies,
  approvers,
  excludeUserId = null,
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

  // If excludeUserId changes or current approver equals excluded id, clear and set error
  useEffect(() => {
    const currentApprover = form.getValues("approverId")
    if (excludeUserId && currentApprover === excludeUserId) {
      form.setValue("approverId", null)
      form.setError("approverId", {
        type: "manual",
        message: "Approver cannot be the same as the user being edited.",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeUserId])

  // Reduced heights so the form fits the viewport without causing page scroll
  const fieldClass = "h-10 min-h-[40px] w-full"
  const buttonHeight = "h-10 min-h-[40px]"
  const errorText = "text-sm text-red-500"

  async function onSubmit(values: UpdateUserInput) {
    toast.dismiss()

    // Client-side guard: prevent submitting self as approver
    if (values.approverId && excludeUserId && values.approverId === excludeUserId) {
      form.setError("approverId", {
        type: "manual",
        message: "Approver cannot be the same as the user being edited.",
      })
      toast.error("Cannot assign the user as their own approver")
      return
    }

    try {
      const result = await updateUserAction(values)

      // Narrow and handle result.error safely (result.error may be unknown)
      if (!result?.success) {
        const errorMap = result?.error

        // Helpful toast for special cases
        if (errorMap && typeof errorMap === "object" && !Array.isArray(errorMap)) {
          const subordinates = (errorMap as any).subordinates
          const globalArr = (errorMap as any)._global

          if (typeof subordinates === "number") {
            toast.error(
              `${(globalArr && Array.isArray(globalArr) && globalArr[0]) || "Cannot change role"} (${subordinates} subordinate(s) must be reassigned)`
            )
          } else if (Array.isArray(globalArr) && globalArr.length > 0) {
            toast.error(`${globalArr[0]}`)
          } else {
            toast.error("Could not update user")
          }

          // Map field errors safely
          for (const [field, messages] of Object.entries(errorMap as Record<string, unknown>)) {
            if (field === "_global" || field === "subordinates") continue
            if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === "string") {
              form.setError(field as any, { message: messages[0] })
            } else {
              form.setError(field as any, { message: String(messages) })
            }
          }
        } else {
          // fallback for unexpected shapes
          toast.error("Could not update user")
          form.setError("_global" as any, { message: String(errorMap) })
        }

        return
      }

      toast.success("🎉 User updated successfully")
      router.push("/admin/users")
    } catch (err) {
      console.error(err)
      toast.error("Unexpected error while updating user")
    }
  }

  return (
    // align to top and reduce outer padding so the card fits the viewport
    <div className="flex justify-center items-start py-6">
      {/* constrain card height and hide overflow so it doesn't push the page */}
      <Card className="w-full max-w-lg shadow-md pb-0 max-h-[calc(100vh-6rem)] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold py-4">
            Edit User
          </CardTitle>
        </CardHeader>

        {/* make the form area scroll internally if it exceeds available height */}
        <CardContent className="px-6 pt-0 pb-4 overflow-auto max-h-[calc(100vh-14rem)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                <SelectContent className="z-50">
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
                <SelectContent className="z-50">
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
                defaultValue={user.approverId ?? NONE_VALUE}
                onValueChange={(v) => form.setValue("approverId", v === NONE_VALUE ? null : v)}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value={NONE_VALUE}>No approver</SelectItem>
                  {approvers.map((a) => (
                    <SelectItem
                      key={a.id}
                      value={a.id}
                      disabled={excludeUserId ? a.id === excludeUserId : false}
                      className={excludeUserId && a.id === excludeUserId ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {a.name}
                      {excludeUserId && a.id === excludeUserId ? " (cannot select this user)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {form.formState.errors.approverId && (
                <p className={errorText}>{form.formState.errors.approverId.message}</p>
              )}
              {excludeUserId && (
                <p className="text-sm text-gray-500 mt-1">You cannot assign the user being edited as their own approver.</p>
              )}
            </div>

            {/* BUTTONS */}
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

