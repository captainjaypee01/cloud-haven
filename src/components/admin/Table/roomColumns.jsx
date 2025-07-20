// components/admin/Table/roomColumns.jsx
import React from "react";
import { formatCurrency } from "@/utils/currency";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const roomColumns = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    Name
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
    },
    {
        accessorKey: "max_guests",
        header: "Guests",
    },
    {
        accessorKey: "price",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    Price
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
        cell: info => {
            return formatCurrency(info.getValue())
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: info => {
            const map = { "available": "Available", "unavailable": "Unavailable", "archived": "Archived" };
            return map[info.getValue()];
        },
    },
];
