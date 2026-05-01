// app/(app)/admin/companies/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table";
import companyColumns, { CompanyRow } from "./columns";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    // If you add a location field to Company, map it here; otherwise leave null
    location: (c as any).location ?? null,
    employeesCount: c._count?.users ?? 0,
    createdAt: c.createdAt.toISOString(),
    isActive: c.isActive,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-end">
        <Link href="/admin/companies/create">
          <Button
            className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            size="lg"
          >
            Create Company
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
        </CardHeader>

        <CardContent>
          <DataTable columns={companyColumns} data={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
