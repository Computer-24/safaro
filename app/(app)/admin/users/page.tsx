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
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>

        <Link href="/admin/users/create">
          <Button>Create User</Button>
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
