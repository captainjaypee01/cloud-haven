// src/components/admin/Table/userColumns.jsx
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// We combine first_name and last_name in one column for "Name"
export const userColumns = [
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
        // We sort by first_name as a proxy for the name
        accessorKey: 'first_name',
        cell: ({ row }) => {
            const user = row.original;
            return `${user.first_name} ${user.last_name}`;
        }
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="flex items-center gap-1"
            >
                Email
                {column.getIsSorted() === 'asc' && <ArrowUp />}
                {column.getIsSorted() === 'desc' && <ArrowDown />}
            </Button>
        ),
        // email is a direct field, cell will just show the email
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="flex items-center gap-1"
            >
                Role
                {column.getIsSorted() === 'asc' && <ArrowUp />}
                {column.getIsSorted() === 'desc' && <ArrowDown />}
            </Button>
        ),
        cell: info => {
            const role = info.getValue();
            // Capitalize role for display
            return <span className='capitalize'>{role}</span>;
        }
    },
    {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="flex items-center gap-1"
            >
                Created At
                {column.getIsSorted() === 'asc' && <ArrowUp />}
                {column.getIsSorted() === 'desc' && <ArrowDown />}
            </Button>
        ),
        cell: info => {
            // Format the timestamp to a readable date/time
            const dateStr = info.getValue();
            return new Date(dateStr).toLocaleString();
        }
    },
];
