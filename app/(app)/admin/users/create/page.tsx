import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import CreateUserForm from "./form";

export default async function CreateUserPage() {
  // Only active companies
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" }, // optional: alphabetical order
  });

  // Only active approvers
  const approvers = await prisma.user.findMany({
    where: {
      role: Role.APPROVER,
      isActive: true,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" }, // optional
  });

  return <CreateUserForm companies={companies} approvers={approvers} />;
}
