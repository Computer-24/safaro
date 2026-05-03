// app/(app)/admin/companies/[id]/page.tsx
import { Role } from "@/app/(app)/generated/prisma/enums";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EditCompanyModal from "@/components/admin/EditCompanyModal";
import { UsersPanel, UsersPanelProvider, UsersToggleButton } from "@/components/admin/UsersPanel";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import CompanyActiveSwitch from "../CompanyActiveSwitch";

interface UpdatedProps {
  params: Promise<{ id: string }> | { id?: string }
}

export default async function CompanyPage({ params }: UpdatedProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams?.id;
  if (!companyId) return notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  const actorRole = session.user.role as Role | undefined;
  if (actorRole !== Role.ADMIN) return notFound();

  try {
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    return (
      // Wrap the page (or the region) with the client provider so both button and panel share state
      <UsersPanelProvider>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{company.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/companies"
                className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-muted"
              >
                ← Back to companies
              </Link>
            </div>
          </header>

          {/* Grid: stack on mobile, 3 cols on md+ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="col-span-2 space-y-4 h-full">
              {/* Details */}
              <div className="rounded-md border p-4 h-auto md:h-44 flex flex-col overflow-hidden md:overflow-auto">
                <h2 className="text-sm font-medium text-muted-foreground">Details</h2>
                <div className="mt-3 flex-1">
                  <dl className="grid grid-cols-1 gap-y-2 gap-x-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Name</dt>
                      <dd className="mt-1 text-sm font-medium">{company.name}</dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">Users</dt>
                      <dd className="mt-1 text-sm">{company._count?.users ?? 0}</dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">Active</dt>
                      <dd className="mt-1 flex">
                        <div className="flex items-center justify-start">
                          <CompanyActiveSwitch id={company.id} initial={company.isActive} disabled={false} />
                        </div>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">Created at</dt>
                      <dd className="mt-1 text-sm">{format(company.createdAt, "PPP")}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-md border p-4 h-auto md:h-36 flex flex-col overflow-hidden md:overflow-auto">
                <h2 className="text-sm font-medium text-muted-foreground">Notes</h2>
                <p className="mt-2 text-sm text-muted-foreground flex-1">
                  Deactivation is restricted by business rules (companies with active users cannot be deactivated).
                </p>
              </div>
            </div>

            <aside className="space-y-4 h-full">
              {/* Quick actions */}
              <div className="rounded-md border p-4 h-auto md:h-44 flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground">Quick actions</h3>
                <div className="mt-3 flex flex-col gap-2 flex-1">
                  {/* Toggle button placed here (client) */}
                  <UsersToggleButton />
                  <EditCompanyModal company={company} />
                </div>
              </div>

              {/* Status */}
              <div className="rounded-md border p-4 h-auto md:h-36 flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="mt-2 text-sm flex-1">
                  <strong className="font-medium">{company.isActive ? "Active" : "Inactive"}</strong>
                </p>
              </div>
            </aside>
          </section>
        </div>
        <UsersPanel companyId={company.id} />
      </UsersPanelProvider>
    );
  } catch (err) {
    console.error("Company page load error:", err);
    return notFound();
  }
}
