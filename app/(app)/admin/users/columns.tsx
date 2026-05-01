"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import UserActiveSwitch from "./UserActiveSwitch";

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  companyName: string | null;
  approverName: string | null;
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

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <SortHeader column={column} label="Email" />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <SortHeader column={column} label="Role" />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const color =
        role === "ADMIN"
          ? "bg-red-500 text-white"
          : role === "APPROVER"
          ? "bg-blue-500 text-white"
          : "bg-primary text-primary-foreground";

      return <Badge className={color}>{role}</Badge>;
    },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => <SortHeader column={column} label="Company" />,
  },
  {
    accessorKey: "approverName",
    header: ({ column }) => <SortHeader column={column} label="Approver" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortHeader column={column} label="Created" />,
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string;
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
      const user = row.original as { id: string; isActive: boolean; role?: string };

      const isAdmin = user.role === "ADMIN";

      return (
        <div className="flex items-center justify-center py-0">
          <UserActiveSwitch
            id={user.id}
            initial={user.isActive}
            disabled={isAdmin}
            disabledReason={isAdmin ? "Admins cannot be deactivated" : undefined}
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
      <div style={{ display: "grid", placeItems: "center", width: "100%", minHeight: "40px" }}>
        <Link href={`/admin/users/${row.original.id}`}>
          <Button
            className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            size="sm"
          >
            User Details
          </Button>
        </Link>
      </div>
    ),
  },

  // Hidden global search column
  {
    id: "search",
    accessorFn: (row) =>
      `${row.name} ${row.email} ${row.role} ${row.companyName} ${row.approverName}`,
    enableHiding: true,
  },
];

export default userColumns;
