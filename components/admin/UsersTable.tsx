// components/admin/UsersTable.tsx
"use client";

import UsersTableUI from "@/app/(app)/admin/users/UsersTableUI";
import { UserRow } from "@/app/(app)/admin/users/columns";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import usersEvents from "@/lib/usersEvents";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import { EmptyBadge } from "../EmptyBadge";
import { ErrorBadge } from "../ErrorBadge";
import { LoadingBadge } from "../LoadingBadge";

type Props = {
  companyId?: string;
  apiUrl?: string; // optional override
};

const PUBLIC_BASE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : undefined;

export default function UsersTable({ companyId, apiUrl }: Props) {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1); // 1-based
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortingState | null>([{ id: "createdAt", desc: true }]);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    setLoading(true);
    try {
      const endpoint = apiUrl ?? (companyId ? `/api/admin/companies/${companyId}/users` : `/api/admin/users`);
      const base = PUBLIC_BASE ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
      const url = new URL(endpoint, base);

      url.searchParams.set("page", String(page));        // page is 1-based
      url.searchParams.set("pageSize", String(pageSize)); // always include pageSize

      // include sort if present (send first sort column)
      if (sort && sort.length > 0) {
        url.searchParams.set("sortBy", String(sort[0].id));
        url.searchParams.set("sortDir", sort[0].desc ? "desc" : "asc");
      }

      console.log("fetching users:", url.toString()); // temporary debug

      const res = await fetch(url.toString(), { signal });

      if (!res.ok) {
        const text = await res.text();
        console.error("Users API error response:", text);
        try {
          const errJson = JSON.parse(text);
          throw new Error(errJson.message || "Failed to load users");
        } catch {
          throw new Error(text || "Failed to load users");
        }
      }

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
      setTotal(typeof json.meta?.total === "number" ? json.meta.total : mapped.length);

      if (typeof json.meta?.pageSize === "number" && json.meta.pageSize !== pageSize) {
        setPageSize(json.meta.pageSize);
      }
      if (typeof json.meta?.page === "number" && json.meta.page !== page) {
        setPage(json.meta.page);
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error(err);
      setError(err.message || "Error");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, page, pageSize, sort, apiUrl]);

  useEffect(() => {
    const controllers = new Set<AbortController>();

    const doFetch = () => {
      const c = new AbortController();
      controllers.add(c);
      fetchUsers(c.signal).finally(() => controllers.delete(c));
    };

    // initial
    doFetch();

    const onCreated = () => doFetch();
    usersEvents.addEventListener("users:created", onCreated);

    return () => {
      usersEvents.removeEventListener("users:created", onCreated);
      controllers.forEach((c) => c.abort());
      controllers.clear();
    };
  }, [fetchUsers]);

  // Handlers used by DataTablePagination (0-based index from table)
  const handlePageChange = (newPageIndex0Based: number) => {
    setPage(newPageIndex0Based + 1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // called by DataTable when header sort changes
  const handleSortChange = (next: SortingState) => {
    setSort(next);
    setPage(1);
  };

  if (error) return <ErrorBadge message={error} />;
  if (rows === null) return <LoadingBadge />;
  if (rows.length === 0) return <EmptyBadge />;

  return (
    <UsersTableUI
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      loading={loading}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSortChange={handleSortChange}
    />
  );
}
