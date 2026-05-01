// components/admin/UsersTable.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import UsersTableUI from "@/app/(app)/admin/users/UsersTableUI";
import { UserRow } from "@/app/(app)/admin/users/columns";

export default function UsersTable({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/users`);
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      const mapped: UserRow[] = (json.users || []).map((u: any) => ({
        id: u.id,
        name: u.name ?? null,
        email: u.email ?? null,
        role: u.role,
        companyName: u.company?.name ?? null,
        approverName: u.approver?.name ?? null,
        createdAt: u.createdAt,
        isActive: !!u.isActive,
      }));
      setRows(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error");
      setRows([]);
    }
  }, [companyId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (error) return <div className="p-4 text-red-600">Error loading users: {error}</div>;
  if (rows === null) return <div className="p-4">Loading users…</div>;
  if (rows.length === 0) return <div className="p-4">No users found.</div>;

  return <UsersTableUI rows={rows} />;
}
