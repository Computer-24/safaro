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
      Object.entries(result.error).forEach(([field, messages]) => {
        form.setError(field as any, { message: messages[0] })
      })

      toast.error("Could not create user", {
        description: "Please fix the errors and try again.",
      })

      return
    }

    toast.success("User created successfully!", {
      description: "Redirecting to user list...",
    })

    router.push("/admin/users")
  }

  return (
    <div className="flex justify-center py-10">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Create User
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* NAME */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...form.register("name")}
                placeholder="John Doe"
                className="h-[44px] w-full"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                {...form.register("email")}
                placeholder="john@example.com"
                className="h-[44px] w-full"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                {...form.register("password")}
                placeholder="******"
                className="h-[44px] w-full"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* COMPANY */}
            <div className="space-y-2">
              <Label>Company</Label>
              <Select onValueChange={(v) => form.setValue("companyId", v)}>
                <SelectTrigger className="h-[44px] min-h-[44px] w-full">
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
                <p className="text-sm text-red-500">{form.formState.errors.companyId.message}</p>
              )}
            </div>

            {/* ROLE */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select onValueChange={(v) => form.setValue("role", v as any)}>
                <SelectTrigger className="h-[44px] min-h-[44px] w-full">
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
                <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
              )}
            </div>

            {/* APPROVER */}
            <div className="space-y-2">
              <Label>Approver</Label>
              <Select onValueChange={(v) => form.setValue("approverId", v)}>
                <SelectTrigger className="h-[44px] min-h-[44px] w-full">
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
                <p className="text-sm text-red-500">{form.formState.errors.approverId.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-[44px] text-base"
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
