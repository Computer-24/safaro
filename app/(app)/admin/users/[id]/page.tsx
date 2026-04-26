// app/(app)/admin/users/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { Role } from "@/app/(app)/generated/prisma/enums"
import UpdateUserForm from "./UpdateUserForm"
import { notFound } from "next/navigation"

interface UpdateUserPageProps {
  params: Promise<{ id: string }> | { id?: string }
}

export default async function UpdateUserPage({ params }: UpdateUserPageProps) {
  const resolvedParams = await params
  const userId = resolvedParams?.id
  if (!userId) {
    notFound() // or return a friendly UI
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    notFound()
  }

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const approvers = await prisma.user.findMany({
    where: { role: Role.APPROVER, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <UpdateUserForm
      user={user}
      companies={companies}
      approvers={approvers}
    />
  )
}
