// app/(app)/admin/companies/CompaniesTableUI.tsx
"use client";

import companyColumns, { CompanyRow } from "@/app/(app)/admin/companies/columns";
import { DataTable } from "@/components/data-table";
import { SortingState } from "@tanstack/react-table";

type Props = {
  rows: CompanyRow[];
  total: number | null;
  page: number; // 1-based
  pageSize: number;
  loading: boolean;
  onPageChange: (newPageIndex0Based: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSortChange?: (sortBy: SortingState) => void; 
};

export default function CompaniesTableUI({
  rows,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: Props) {
  return (
    <DataTable
      columns={companyColumns}
      data={rows}
      serverPagination={{
        total,
        page,
        pageSize,
        loading,
        onPageChange,
        onPageSizeChange,
        onSortChange,
      }}
    />
  );
}
