// components/data-table-pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table } from "@tanstack/react-table";

type ServerPagination = {
  total: number | null;
  page: number; // 1-based
  pageSize: number;
  loading?: boolean;
  onPageChange: (newPageIndex0Based: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
};

export function DataTablePagination({
  table,
  serverPagination = null,
}: {
  table: Table<any>;
  serverPagination?: ServerPagination | null;
}) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  const pageCount = serverPagination && typeof serverPagination.total === "number"
    ? Math.max(1, Math.ceil(serverPagination.total / Math.max(1, serverPagination.pageSize)))
    : table.getPageCount();

  const canPrevious = pageIndex > 0;
  const canNext = pageIndex + 1 < pageCount;

  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  // Only call server handlers. Do NOT call table.setPageIndex/setPageSize here.
  const goToPage = (newPageIndex: number) => {
    if (!serverPagination) {
      // client-side pagination: update table directly
      table.setPageIndex(newPageIndex);
      return;
    }
    if (newPageIndex < 0) newPageIndex = 0;
    if (newPageIndex >= pageCount) newPageIndex = pageCount - 1;
    serverPagination.onPageChange(newPageIndex); // 0-based
  };

  const changePageSize = (newSize: number) => {
    if (!serverPagination) {
      table.setPageSize(newSize);
      table.setPageIndex(0);
      return;
    }
    serverPagination.onPageSizeChange(newSize);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => goToPage(pageIndex - 1)} disabled={!canPrevious}>
          Previous
        </Button>

        <span>
          Page {pageIndex + 1} of {pageCount}
        </span>

        <Button variant="outline" onClick={() => goToPage(pageIndex + 1)} disabled={!canNext}>
          Next
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Rows per page</label>

        <Select value={String(pageSize)} onValueChange={(v) => changePageSize(Number(v))}>
          <SelectTrigger
            className="h-9 w-28 rounded-md border px-3 text-sm
               bg-white text-slate-900 border-slate-200
               dark:bg-[#2b2b2f] dark:text-[#e6e6e6] dark:border-[#3a3a3f]
               focus:ring-2 focus:ring-primary/40"
            aria-label="Rows per page"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent className="w-28 bg-white text-slate-900 dark:bg-[#2b2b2f] dark:text-[#e6e6e6]">
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-sm">
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
