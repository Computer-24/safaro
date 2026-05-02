// app/(app)/admin/users/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import UpdateUserForm from "./UpdateUserForm";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface UpdateUserPageProps {
  params: Promise<{ id: string }> | { id?: string };
}

export default async function UpdateUserPage({ params }: UpdateUserPageProps) {
  const resolvedParams = await params;
  const userId = resolvedParams?.id;
  if (!userId) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) return redirect("/login"); // use your login route

  const isAdmin = session.user.role === Role.ADMIN;
  const isSelf = session.user.id === userId;
  if (!isAdmin && !isSelf) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      approverId: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const companies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const approvers = await prisma.user.findMany({
    where: {
      role: Role.APPROVER,
      isActive: true,
      AND: [
        { id: { not: userId } }, // exclude the edited user
        {
          OR: [
            { approverId: null },               // include approvers with no approver
            { approverId: { not: userId } },    // include approvers that don't point to this user
          ],
        },
      ],
    },
    select: { id: true, name: true, approverId: true },
    orderBy: { name: "asc" },
  });

  return (
    <UpdateUserForm
      user={user}
      companies={companies}
      approvers={approvers}
      excludeUserId={userId}
    />
  );
}
