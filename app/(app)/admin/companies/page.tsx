// app/(app)/admin/companies/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CompaniesTable from "@/components/admin/CompaniesTable";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        <Link href="/admin/companies/create">
          <Button className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity" size="lg">
            Create Company
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
        </CardHeader>

        <CardContent>
          <CompaniesTable />
        </CardContent>
      </Card>
    </div>
  );
}
