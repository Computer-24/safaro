import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreateUserModal from "@/components/admin/CreateUserModal";
import UsersTable from "@/components/admin/UsersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPROVER_LIST_DROPDOWN_CAP } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
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
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        {/* Use the CreateUserModal instead of a link */}
        <CreateUserModal
          // If you have server-side lists, pass them here:
          companies={companies}
          approvers={approvers}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{"All Users"}</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
}
