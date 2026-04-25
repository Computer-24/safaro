import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UserDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>My Pending Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tickets waiting for approval.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Approved Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your approved safety observations.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Continue where you left off.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Approved Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">See approved observations from all companies.</p>
        </CardContent>
      </Card>
    </div>
  );
}
