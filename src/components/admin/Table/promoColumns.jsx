// src/components/admin/Table/promoColumns.jsx
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from '@/lib/format';

// Accept handler functions as parameters
export const promoColumns = ({ onEdit, onDelete, onStatusChange, onExclusiveChange, selectedIds, toggleSelect, toggleSelectAll }) => {
    const allSelected = selectedIds.length > 0 && selectedIds.length === /** total rows on current page **/ selectedIds.length;
    return [
        {
            id: "select",
            header: () => (
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(row.original.id)}
                    onChange={() => toggleSelect(row.original.id)}
                />
            ),
        },
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => row.original.code,
        },
        {
          accessorKey: 'title',
          header: 'Title',
          cell: ({ row }) => row.original.title || '—',
        },
        {
          accessorKey: 'scope',
          header: 'Scope',
          cell: ({ row }) => row.original.scope || '—',
        },
        {
            id: "discount",
            header: "Discount",
            cell: ({ row }) => {
                const promo = row.original;
                // Show discount value with proper unit
                return promo.discount_type === "percentage"
                    ? `${promo.discount_value}%`
                    : `${formatCurrency(promo.discount_value)}`;
            },
        },
        {
            accessorKey: "expires_at",
            header: "Expires At",
            cell: ({ row }) => row.original.expires_at ? formatDate(row.original.expires_at) : "Never"
        },
        {
            accessorKey: "max_uses",
            header: "Max Uses",
            cell: ({ row }) => row.original.max_uses ?? "Unlimited",
        },
        {
            accessorKey: "uses_count",
            header: "Used",
            cell: ({ row }) => row.original.uses_count ?? 0,
        },
        {
            id: 'exclusive',
            header: 'Exclusive',
            cell: ({ row }) => (
                <Switch
                    checked={!!row.original.exclusive}
                    onCheckedChange={() => onExclusiveChange(row.original)}
                    className="cursor-pointer"
                />
            ),
        },
        {
            id: "active",
            header: "Status",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.active === "active"}
                    onCheckedChange={() => onStatusChange(row.original)}
                    className="cursor-pointer"
                />
            ),
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
