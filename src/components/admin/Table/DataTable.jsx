// src/components/admin/Table/DataTable.jsx
import React from "react";
import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
} from "@tanstack/react-table";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import LoaderTable from "./LoaderTable";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const DataTable = ({
    columns,
    data,
    pageCount,
    state,
    onPaginationChange,
    manualPagination = false,
    loading = false,
    onSortingChange,
    onPageSizeChange,
}) => {
    // Ensure sorting state is always an array (important for TanStack Table)
    const safeState = {
        ...state,
        sorting: Array.isArray(state?.sorting) ? state.sorting : [],
    };
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination,
        pageCount,
        state: safeState,
        onPaginationChange,
        onSortingChange,
        enableSorting: true,
    });

    return (
        <div className="w-full">
            {/* Table and footer as a single card */}
            <div className="rounded-md border bg-white dark:bg-gray-950 relative flex flex-col">
                {loading && <LoaderTable />}
                <Table className={loading ? "opacity-60 pointer-events-none" : ""}>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                                        // onClick={
                                        //     header.column.getCanSort()
                                        //         ? () => header.column.toggleSorting(
                                        //             header.column.getIsSorted() === "asc"
                                        //         )
                                        //         : undefined
                                        // }
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {/* Footer controls */}
                <div className="border-t px-4 py-2 flex items-center justify-between text-sm">
                    {/* Left side: Rows per page selector */}
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            className="border border-input bg-transparent rounded px-1 py-0.5"
                            value={table.getState().pagination.pageSize}
                            onChange={e => {
                                table.setPageSize(Number(e.target.value));
                                onPageSizeChange && onPageSizeChange(Number(e.target.value));
                            }}
                        >
                            {[10, 20, 50, 100].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    {/* Right side: Page numbers and navigation */}
                    <div className="flex items-center gap-6">
                        <span>
                            Page {table.getState().pagination.pageIndex + 1}{" "}
                            of {manualPagination ? pageCount : table.getPageCount()}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                                aria-label="First page"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => table.setPageIndex((manualPagination ? pageCount : table.getPageCount()) - 1)}
                                disabled={!table.getCanNextPage()}
                                aria-label="Last page"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
