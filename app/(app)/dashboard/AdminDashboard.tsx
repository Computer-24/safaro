import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/users" className="text-primary hover:underline">
            Manage all users →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/companies" className="text-primary hover:underline">
            Manage companies →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/tickets/all" className="text-primary hover:underline">
            View all tickets →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">System-wide activity overview.</p>
        </CardContent>
      </Card>
    </div>
  );
}
