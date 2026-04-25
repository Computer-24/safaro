"use client"

import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export function DataTablePagination({ table }: { table: Table<any> }) {
  return (
    <div className="flex items-center justify-between py-2">
      <Button
        variant="outline"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>

      <span>
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </span>

      <Button
        variant="outline"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  )
}
