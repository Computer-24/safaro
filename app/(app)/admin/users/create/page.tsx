// app/(app)/admin/users/create/page.tsx
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/(app)/generated/prisma/enums";
import CreateUserForm from "./form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { APPROVER_LIST_DROPDOWN_CAP } from "@/lib/pagination";
import Link from "next/link";

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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-6 flex items-center justify-end">
        <Link
          href="/admin/users"
          className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-muted"
        >
          ← Back to users
        </Link>
      </header>

      <CreateUserForm companies={companies} approvers={approvers} />
    </div>
  );
}
