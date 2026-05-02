// components/DataTable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
  Updater,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { DataTablePagination } from "./data-table-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

interface ServerPagination {
  total: number | null;
  page: number; // 1-based
  pageSize: number;
  loading?: boolean;
  onPageChange: (newPageIndex0Based: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onSortChange?: (sortBy: SortingState) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  serverPagination?: ServerPagination | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  serverPagination = null,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
  });

  const isServer = !!serverPagination;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageIndex: isServer ? Math.max(0, (serverPagination?.page ?? 1) - 1) : 0,
        pageSize: isServer ? serverPagination?.pageSize ?? DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE,
      },
    },
    pageCount: isServer && serverPagination?.total ? Math.ceil(serverPagination.total / serverPagination.pageSize) : undefined,
    manualPagination: isServer,
    manualSorting: isServer, // tell react-table sorting is server-driven
    // CUSTOM handler instead of passing setSorting directly
    onSortingChange: (updaterOrValue: SortingState | Updater<SortingState>) => {
      // resolve the actual next sorting state whether react-table passed a value or an updater
      const nextSorting: SortingState =
        typeof updaterOrValue === "function"
          ? (updaterOrValue as (old: SortingState) => SortingState)(sorting)
          : (updaterOrValue as SortingState);

      // update local state
      setSorting(nextSorting);

      // if server-driven, notify parent and reset to first page
      if (isServer && serverPagination?.onSortChange) {
        const payload = nextSorting.map((s) => ({ id: String(s.id), desc: !!s.desc }));
        serverPagination.onSortChange(payload);
        serverPagination.onPageChange(0); // go to first page (0-based index for onPageChange)
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    ...(isServer ? {} : { getSortedRowModel: getSortedRowModel() }),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    if (!isServer || !serverPagination) return;
    if (serverPagination.loading) return; // preserve optimistic UI while loading

    const pageIndex0 = Math.max(0, serverPagination.page - 1);
    if (table.getState().pagination.pageIndex !== pageIndex0) {
      table.setPageIndex(pageIndex0);
    }
    if (table.getState().pagination.pageSize !== serverPagination.pageSize) {
      table.setPageSize(serverPagination.pageSize);
    }
  }, [isServer, serverPagination, table]);



  return (
    <div className="space-y-4 w-full">
      <Input
        placeholder="Search users..."
        value={(table.getColumn("search")?.getFilterValue() as string) ?? ""}
        onChange={(e) =>
          table.getColumn("search")?.setFilterValue(e.target.value)
        }
        className="max-w-sm"
      />

      <div className="rounded-md border overflow-x-auto w-full">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-2"
                      style={{ height: "auto" }}
                      data-col-id={cell.column.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} serverPagination={serverPagination} />
    </div>
  );
}

export default DataTable;
