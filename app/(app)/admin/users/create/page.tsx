import { prisma } from "@/lib/prisma"
import { Role } from "@/app/(app)/generated/prisma/enums"
import CreateUserForm from "./form"

export default async function CreateUserPage() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  })

  const approvers = await prisma.user.findMany({
    where: { role: Role.APPROVER },
    select: { id: true, name: true },
  })

  return <CreateUserForm companies={companies} approvers={approvers} />
}
