// app/(app)/admin/users/[id]/page.tsx
import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EditUserModal from "@/components/admin/EditUserModal";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import UserActiveSwitch from "../UserActiveSwitch";

interface UpdatedProps {
  params: Promise<{ id: string }> | { id?: string }
}

export default async function UserPage({ params }: UpdatedProps) {
  const resolvedParams = await params;
  const userId = resolvedParams?.id;
  if (!userId) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  const actorRole = session.user.role as Role | undefined;
  const isAdmin = actorRole === Role.ADMIN;
  const isSelf = session.user.id === userId;
  if (!isAdmin && !isSelf) return notFound();

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        company: { select: { id: true, name: true } },
        approverId: true,
        approver: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    const subordinateCount = await prisma.user.count({
      where: { approverId: userId },
    });

    // Fetch companies and approvers for the EditUserModal (server-side)
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
          { id: { not: userId } },
          {
            OR: [
              { approverId: null },
              { approverId: { not: userId } },
            ],
          },
        ],
      },
      select: { id: true, name: true, approverId: true },
      orderBy: { name: "asc" },
    });

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{user.name ?? user.email}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-muted"
            >
              ← Back to users
            </Link>
          </div>
        </header>

        {/* Grid: stack on mobile, 3 cols on md+ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="col-span-2 space-y-4 h-full">
            {/* Details: fixed desktop height, not scrollable */}
            <div className="rounded-md border p-4 h-auto md:h-56 flex flex-col overflow-visible">
              <h2 className="text-sm font-medium text-muted-foreground">Details</h2>
              <div className="mt-3 flex-1">
                <dl className="grid grid-cols-1 gap-y-2 gap-x-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="mt-1 text-sm font-medium">{user.name}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Role</dt>
                    <dd className="mt-1 text-sm">{user.role}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Company</dt>
                    <dd className="mt-1 text-sm">{user.company?.name ?? "—"}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Approver</dt>
                    <dd className="mt-1 text-sm">{user.approver?.name ?? "—"}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Subordinates</dt>
                    <dd className="mt-1 text-sm">{subordinateCount}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted-foreground">Created at</dt>
                    <dd className="mt-1 text-sm">{format(user.createdAt, "PPP")}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Notes: same fixed height so alignment matches; not scrollable */}
            <div className="rounded-md border p-4 h-auto md:h-40 flex flex-col overflow-visible">
              <h2 className="text-sm font-medium text-muted-foreground">Notes</h2>
              <p className="mt-2 text-sm text-muted-foreground flex-1">
                User deactivation and role changes may be restricted by business rules (e.g., approver relationships).
              </p>
            </div>
          </div>

          <aside className="space-y-4 h-full">
            {/* Quick actions: same fixed height */}
            <div className="rounded-md border p-4 h-auto md:h-56 flex flex-col">
              <h3 className="text-sm font-medium text-muted-foreground">Quick actions</h3>
              <div className="mt-3 flex flex-col gap-2 flex-1">
                <EditUserModal
                  user={{
                    id: user.id,
                    name: user.name ?? "",
                    email: user.email ?? "",
                    role: user.role,
                    companyId: user.companyId ?? null,
                    approverId: user.approverId ?? null,
                  }}
                  companies={companies}
                  approvers={approvers}
                  excludeUserId={userId}
                  triggerLabel="Edit user"
                />
              </div>
            </div>

            {/* Status: same fixed height; switch aligned to bottom-right */}
            <div className="rounded-md border p-4 h-auto md:h-40 flex flex-col">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>

              {/* main status text */}
              <div className="mt-2 text-sm flex-1">
                <strong className="font-medium">{user.isActive ? "Active" : "Inactive"}</strong>
              </div>

              {/* bottom row: right-aligned switch */}
              <div className="mt-3 flex justify-start">
                <UserActiveSwitch id={user.id} initial={user.isActive} disabled={!isAdmin && !isSelf} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    );
  } catch (err) {
    console.error("User page load error:", err);
    return notFound();
  }
}
