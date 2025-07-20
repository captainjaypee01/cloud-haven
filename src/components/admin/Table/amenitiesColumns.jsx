// components/admin/Table/amenitiesColumns.js
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// Accepts handlers for actions from parent
export const amenityColumns = ({ onEdit, onDelete, onStatusChange }) => [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description || "-",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Switch
                checked={row.original.status === "active"}
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
                <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => onEdit(row.original)}
                >
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => onDelete(row.original)}
                >
                    Delete
                </Button>
            </div>
        ),
    },
];
