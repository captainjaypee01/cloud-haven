// src/components/admin/Table/mealProgramColumns.jsx
import React from 'react';
import { ArrowDown, ArrowUp, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

// Accept handler functions as parameters
export const mealProgramColumns = ({ onEdit, onDelete, onView, onPreview }) => {
    return [
        {
            id: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-1"
                >
                    Name
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            ),
            accessorKey: 'name',
            cell: ({ row }) => row.original.name,
        },
        {
            id: 'status',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-1"
                >
                    Status
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            ),
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            id: 'scope_type',
            header: 'Scope',
            accessorKey: 'scope_type',
            cell: ({ row }) => {
                const scopeType = row.original.scope_type;
                const getScopeDescription = (type) => {
                    switch (type) {
                        case 'always': return 'Always active';
                        case 'date_range': return 'Date range';
                        case 'months': return 'Specific months';
                        case 'weekly': return 'Weekly pattern';
                        case 'composite': return 'Composite rules';
                        default: return type;
                    }
                };
                return getScopeDescription(scopeType);
            },
        },
        {
            id: 'date_range',
            header: 'Date Range',
            cell: ({ row }) => {
                const program = row.original;
                if (program.scope_type === 'date_range' && program.date_start && program.date_end) {
                    return `${formatDate(program.date_start)} - ${formatDate(program.date_end)}`;
                }
                return '-';
            },
        },
        {
            id: 'pricing_tiers',
            header: 'Pricing Tiers',
            cell: ({ row }) => {
                const tiers = row.original.pricing_tiers || [];
                return tiers.length;
            },
        },
        {
            id: 'created_at',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="flex items-center gap-1"
                >
                    Created
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            ),
            accessorKey: 'created_at',
            cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onView(row.original)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onPreview(row.original)}
                    >
                        <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => onEdit(row.original)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => onDelete(row.original)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            enableSorting: false,
        },
    ];
};
