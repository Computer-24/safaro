"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string
  companyName: string | null
  approverName: string | null
  createdAt: string
}

function SortHeader({ column, label }: any) {
  const sorted = column.getIsSorted()

  return (
    <button
      className="flex items-center gap-1"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}

      {/* Sorting indicator */}
      {sorted === false && <span className="opacity-40">↕</span>}
      {sorted === "asc" && <span>↑</span>}
      {sorted === "desc" && <span>↓</span>}
    </button>
  )
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
      const role = row.getValue("role") as string
      const color =
        role === "ADMIN"
          ? "bg-red-500 text-white"
          : role === "APPROVER"
          ? "bg-blue-500 text-white"
          : "bg-green-500 text-white"

      return <Badge className={color}>{role}</Badge>
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
      const date = new Date(row.getValue("createdAt"))
      return date.toLocaleDateString()
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link
        href={`/admin/users/${row.original.id}`}
        className="text-primary hover:underline"
      >
        Edit →
      </Link>
    ),
  },

  // Global search column (hidden)
  {
  id: "search",
  accessorFn: (row) =>
    `${row.name} ${row.email} ${row.role} ${row.companyName} ${row.approverName}`,
  enableHiding: true, // allow hiding
}

]
