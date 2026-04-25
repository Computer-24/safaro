import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      company: true,
      approver: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      {/* Header Row */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 text-left font-medium">Name</th>
                  <th className="py-2 text-left font-medium">Email</th>
                  <th className="py-2 text-left font-medium">Role</th>
                  <th className="py-2 text-left font-medium">Company</th>
                  <th className="py-2 text-left font-medium">Approver</th>
                  <th className="py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3">{user.email}</td>

                    <td className="py-3">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>

                    <td className="py-3">
                      {user.company?.name ?? "—"}
                    </td>

                    <td className="py-3">
                      {user.approver?.name ?? "—"}
                    </td>

                    <td className="py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-primary hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
