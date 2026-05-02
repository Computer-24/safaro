// components/admin/CompaniesTable.tsx
"use client";

import { CompanyRow } from "@/app/(app)/admin/companies/columns";
import CompaniesTableUI from "@/app/(app)/admin/companies/CompaniesTableUI";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { useCallback, useEffect, useState } from "react";

type Props = { apiUrl?: string };

export default function CompaniesTable({ apiUrl }: Props) {
    const [rows, setRows] = useState<CompanyRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState<{ id: string; desc: boolean }[] | null>(null);

    const endpoint = apiUrl ?? "/api/admin/companies";

    const fetchCompanies = useCallback(async (signal?: AbortSignal) => {
        setError(null);
        setLoading(true);
        try {
            const base = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000");
            const url = new URL(endpoint, base);
            url.searchParams.set("page", String(page));
            url.searchParams.set("pageSize", String(pageSize));
            if (sort && sort.length) {
                // send first sort column (or encode multiple)
                url.searchParams.set("sortBy", sort[0].id);
                url.searchParams.set("sortDir", sort[0].desc ? "desc" : "asc");
            }

            const res = await fetch(url.toString(), { signal });
            if (!res.ok) throw new Error("Failed to load companies");
            const json = await res.json();

            const mapped: CompanyRow[] = (json.companies || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                location: null,
                employeesCount: c._count?.users ?? 0,
                createdAt: c.createdAt,
                isActive: !!c.isActive,
            }));

            setRows(mapped);
            setTotal(typeof json.meta?.total === "number" ? json.meta.total : mapped.length);

            if (typeof json.meta?.pageSize === "number" && json.meta.pageSize !== pageSize) setPageSize(json.meta.pageSize);
            if (typeof json.meta?.page === "number" && json.meta.page !== page) setPage(json.meta.page);
        } catch (err: any) {
            if (err.name === "AbortError") return;
            console.error(err);
            setError(err.message || "Error");
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [endpoint, page, pageSize, sort]);

    useEffect(() => {
        const ac = new AbortController();
        fetchCompanies(ac.signal);
        return () => ac.abort();
    }, [fetchCompanies, sort]);

    const handlePageChange = (newPageIndex0Based: number) => setPage(newPageIndex0Based + 1);
    const handlePageSizeChange = (newSize: number) => { setPageSize(newSize); setPage(1); };
    const handleSortChange = useCallback((nextSort: { id: string; desc: boolean }[]) => {
        setSort(nextSort);
        setPage(1); // server pages are 1-based in your code
    }, []);

    if (error) return <div className="p-4 text-red-600">Error loading companies: {error}</div>;
    if (rows === null) return <div className="p-4">Loading companies…</div>;
    if (rows.length === 0) return <div className="p-4">No companies found</div>;

    return (
        <CompaniesTableUI
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
