// components/admin/Table/DataTable.jsx
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
    // Ensure sorting state is always an array (important for TanStack Table!)
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
            <div className="relative rounded-md border bg-white">
                {loading && <LoaderTable />}
                <Table className={loading ? "opacity-60 pointer-events-none" : ""}>
                    <TableHeader>
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id}>
                                {hg.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
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
            </div>
            <div className="flex items-center justify-between p-2 gap-4 flex-wrap">
                <div className="flex items-center gap-2 ">
                    <Button size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="cursor-pointer">Previous</Button>
                    <Button size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="cursor-pointer">Next</Button>
                </div>
                <div className="flex items-center gap-2">
                    <label>Rows per page:</label>
                    <select
                        className="border rounded px-1 py-0.5 text-sm"
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
                    <span>
                        Page {table.getState().pagination.pageIndex + 1} of {manualPagination ? pageCount : table.getPageCount()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
