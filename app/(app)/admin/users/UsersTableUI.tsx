// app/(app)/admin/users/UsersTableUI.tsx
"use client";

import React from "react";
import { DataTable } from "@/components/data-table";
import { userColumns, UserRow } from "./columns";

export default function UsersTableUI({ rows }: { rows: UserRow[] }) {
  return <DataTable columns={userColumns} data={rows} />;
}
