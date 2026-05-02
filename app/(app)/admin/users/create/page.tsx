// app/(app)/admin/users/create/page.tsx
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import CreateUserForm from "./form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { APPROVER_LIST_DROPDOWN_CAP } from "@/lib/pagination";

export default async function CreateUserPage() {
  // Server-side session + RBAC: only admins can create users
  const session = await getServerSession(authOptions);
  if (!session?.user) return redirect("/login");
  if (session.user.role !== Role.ADMIN) return redirect("/");

  // Minimal company list for selects (only active companies)
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Minimal approver list: only active approvers, include approverId so UI can show hints.
  // If you have many approvers, replace this with a paginated/search endpoint.
  const approvers = await prisma.user.findMany({
    where: {
      role: Role.APPROVER,
      isActive: true,
    },
    select: { id: true, name: true, approverId: true },
    orderBy: { name: "asc" },
    take: APPROVER_LIST_DROPDOWN_CAP, // safety cap to avoid huge payloads; tune as needed
  });

  return <CreateUserForm companies={companies} approvers={approvers} />;
}
