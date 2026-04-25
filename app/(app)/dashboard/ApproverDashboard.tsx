import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ApproverDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Assigned to Me</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tickets awaiting your review.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Needs Correction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tickets sent back to users.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resubmitted Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tickets resubmitted for approval.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delegation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your current delegation settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}
