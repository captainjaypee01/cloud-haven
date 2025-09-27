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
            accessorKey: "starts_at",
            header: "Date Start",
            cell: ({ row }) => {
                const startsAt = row.original.starts_at;
                if (!startsAt) return "—";
                return formatDate(startsAt);
            },
        },
        {
            accessorKey: "ends_at",
            header: "Date End",
            cell: ({ row }) => {
                const endsAt = row.original.ends_at;
                if (!endsAt) return "—";
                return formatDate(endsAt);
            },
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
            id: 'per_night_calculation',
            header: 'Per-Night',
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                    row.original.per_night_calculation 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                }`}>
                    {row.original.per_night_calculation ? 'Yes' : 'No'}
                </span>
            ),
        },
        {
            id: 'excluded_days',
            header: 'Excluded Days',
            cell: ({ row }) => {
                const excludedDays = row.original.excluded_days || [];
                if (excludedDays.length === 0) {
                    return <span className="text-gray-500">None</span>;
                }
                
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const excludedDayNames = excludedDays.map(day => dayNames[day]).join(', ');
                return (
                    <span className="text-sm" title={excludedDayNames}>
                        {excludedDayNames}
                    </span>
                );
            },
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
