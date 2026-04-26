import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { userColumns, UserRow } from "./columns"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      company: true,
      approver: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    companyName: u.company?.name ?? null,
    approverName: u.approver?.name ?? null,
    createdAt: u.createdAt.toISOString(),
    isActive: u.isActive,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        <Link href="/admin/users/create">
          <Button
            className="h-10 min-h-10 text-base flex items-center gap-2
                       bg-green-600 text-white border border-green-600
                       hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5
                       transition transform duration-150 ease-in-out
                       focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-300"
            aria-label="Create User"
          >
            <span>Create User</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>

        <CardContent>
          <DataTable columns={userColumns} data={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
