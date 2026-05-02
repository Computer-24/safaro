import UsersTable from "@/components/admin/UsersTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function UsersPage() {
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
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
}
