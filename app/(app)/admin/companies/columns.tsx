// components/companies/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import CompanyActiveSwitch from "./CompanyActiveSwitch";
import { format, parseISO } from "date-fns";

export type CompanyRow = {
  id: string;
  name: string;
  location?: string | null;
  employeesCount?: number | null;
  createdAt: string;
  isActive: boolean;
};

function SortHeader({ column, label }: any) {
  const sorted = column.getIsSorted();

  return (
    <button
      className="flex items-center gap-1"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === false && <span className="opacity-40">↕</span>}
      {sorted === "asc" && <span>↑</span>}
      {sorted === "desc" && <span>↓</span>}
    </button>
  );
}

export const companyColumns: ColumnDef<CompanyRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Name" />,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <div className="font-medium">{name}</div>;
    },
  },
  {
    accessorKey: "employeesCount",
    header: ({ column }) => <SortHeader column={column} label="Employees" />,
    cell: ({ row }) => {
      const count = row.getValue("employeesCount") as number | undefined | null;
      return (
        <div>
          <Badge className="bg-primary text-primary-foreground">
            {typeof count === "number" ? count : "0"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortHeader column={column} label="Created" />,
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string;
      // parse ISO string and format using date-fns
      const date = parseISO(raw);
      return <span>{format(date, "PPP")}</span>;
    },
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: ({ column }) => (
      <div className="flex justify-center">
        <SortHeader column={column} label="Active" />
      </div>
    ),
    cell: ({ row }) => {
      const company = row.original as CompanyRow;

      // If you want to disable toggling for certain companies, add logic here.
      return (
        <div className="flex items-center justify-center py-0">
          <CompanyActiveSwitch
            id={company.id}
            initial={company.isActive}
            onSuccess={(next) => {
              toast.success(next ? "Company activated" : "Company deactivated");
            }}
          />
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="flex justify-center">
        <span>Actions</span>
      </div>
    ),
    cell: ({ row }) => (
      <div style={{ display: "grid", placeItems: "center", width: "100%", minHeight: 40 }}>
        <Link href={`/admin/companies/${row.original.id}`}>
          <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90">
            Company Details
          </Button>
        </Link>
      </div>
    ),
  },

  // Hidden global search column
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.location} ${row.employeesCount}`,
    enableHiding: true,
  },
];

export default companyColumns;
