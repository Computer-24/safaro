import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UsersTableUI from "./UsersTableUI";
import { UserRow } from "./columns";
import { log } from "node:console";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { company: true, approver: true },
    orderBy: { createdAt: "desc" },
  });


  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    companyName: u.company?.name ?? null,
    approverName: u.approver?.name ?? null,
    createdAt: u.createdAt.toISOString(),
    isActive: u.isActive,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        <Link href="/admin/users/create">
          <Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90">
            Create User
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{"All Users"}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Server -> Client render */}
          <UsersTableUI rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
