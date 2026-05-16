// app/(app)/admin/companies/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CreateCompanyModal from "@/components/admin/CreateCompanyModal";
import CompaniesTable from "@/components/admin/CompaniesTable";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        <CreateCompanyModal />
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
