// components/admin/Table/dayTourPricingColumns.jsx
import React from "react";
import { formatCurrency } from "@/utils/currency";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const dayTourPricingColumns = [
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
        accessorKey: "price_per_pax",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    Price per Pax
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
        cell: info => formatCurrency(info.getValue()),
    },
    {
        accessorKey: "effective_from",
        header: "Effective From",
        cell: info => format(new Date(info.getValue()), 'MMM dd, yyyy'),
    },
    {
        accessorKey: "effective_until",
        header: "Effective Until",
        cell: info => {
            const value = info.getValue();
            return value ? format(new Date(value), 'MMM dd, yyyy') : 'Ongoing';
        },
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: info => {
            const isActive = info.getValue();
            return (
                <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            );
        },
    },
];
