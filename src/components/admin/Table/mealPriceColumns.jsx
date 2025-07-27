// src/components/admin/Table/mealPriceColumns.jsx
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from '@/lib/format';

// Accept handler functions as parameters
export const mealPriceColumns = ({ onEdit, onDelete, onStatusChange, selectedIds, toggleSelect, toggleSelectAll }) => {
    return [
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => row.original.category,
        },
        {
            id: "price",
            header: "Price",
            cell: ({ row }) => {
                return `${formatCurrency(row.original.price)}`;
            },
        },
        {
            accessorKey: "min_age",
            header: "Age range",
            cell: ({ row }) => {
                const minAge = row.original.min_age;
                const maxAge = row.original.max_age ?? "N";
                return `${minAge} - ${maxAge}`
            },
        },
        {
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button variant="outline" className="cursor-pointer" size="sm" onClick={() => onEdit(row.original)}>
                        Edit
                    </Button>
                    <Button variant="destructive" className="cursor-pointer" size="sm" onClick={() => onDelete(row.original)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];
};
