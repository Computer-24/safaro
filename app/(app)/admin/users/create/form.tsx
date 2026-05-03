"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createUserSchema, CreateUserInput, RoleEnum } from "./schema"
import { createUserAction } from "./actions"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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

type CompanyOption = { id: string; name: string }
type ApproverOption = { id: string; name: string }

const NONE_VALUE = "__none" // sentinel for "No approver" (must be non-empty)

export default function CreateUserForm({
  companies,
  approvers,
}: {
  companies: CompanyOption[]
  approvers: ApproverOption[]
}) {
  const router = useRouter()

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "USER",
      approverId: null,
    },
  })

  async function onSubmit(values: CreateUserInput) {
    const result = await createUserAction(values)

    if (result?.error) {
      const err = result.error

      if (err && typeof err === "object" && !Array.isArray(err)) {
        for (const [field, messages] of Object.entries(err)) {
          if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === "string") {
            form.setError(field as any, { message: messages[0] })
          } else {
            form.setError(field as any, { message: String(messages) })
          }
        }
      } else {
        // fallback for unexpected shapes
        form.setError("_global" as any, { message: String(err) })
      }

      toast.error("Could not create user", {
        description: "Please fix the errors and try again",
      })

      return
    }

    toast.success("User created successfully", { duration: 3000 })
    router.push("/admin/users")
  }

  // Reduced heights and internal scrolling so the form fits the viewport without causing page scroll
  const fieldClass = "h-10 min-h-[40px] w-full"
  const buttonHeight = "h-10 min-h-[40px]"
  const errorText = "text-sm text-red-500"

  return (
    // align to top and reduce outer padding so the card fits the viewport
    <div className="flex justify-center items-start py-6">
      {/* constrain card height and hide overflow so it doesn't push the page */}
      <Card className="w-full max-w-lg shadow-md pb-0 max-h-[calc(100vh-6rem)] overflow-hidden">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold py-4">
            Create User
          </CardTitle>
        </CardHeader>

        {/* make the form area scroll internally if it exceeds available height */}
        <CardContent className="px-6 pt-0 pb-4 overflow-auto max-h-[calc(100vh-14rem)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* NAME */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...form.register("name")}
                placeholder="John Doe"
                className={fieldClass}
              />
              {form.formState.errors.name && (
                <p className={errorText}>{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                {...form.register("email")}
                placeholder="john@example.com"
                className={fieldClass}
              />
              {form.formState.errors.email && (
                <p className={errorText}>{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                {...form.register("password")}
                placeholder="******"
                className={fieldClass}
              />
              {form.formState.errors.password && (
                <p className={errorText}>{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* COMPANY */}
            <div className="space-y-2">
              <Label>Company</Label>
              <Select onValueChange={(v) => form.setValue("companyId", v)}>
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
              <Select onValueChange={(v) => form.setValue("role", v as any)}>
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
                // no defaultValue needed; placeholder will show when approverId is null
                onValueChange={(v) => form.setValue("approverId", v === NONE_VALUE ? null : v)}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value={NONE_VALUE}>No approver</SelectItem>
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

            <Button
              type="submit"
              className={`w-full ${buttonHeight} text-base`}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

