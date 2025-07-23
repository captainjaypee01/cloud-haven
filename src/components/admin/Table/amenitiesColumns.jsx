// components/admin/Table/amenitiesColumns.jsx
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// Accepts handlers for actions from parent
// components/admin/Table/amenitiesColumns.jsx
export const amenityColumns = ({ onEdit, onDelete, onStatusChange, iconsModule }) => [
    {
        id: "icon",
        header: "Icon",
        cell: ({ row }) => {
            const Icon = iconsModule[row.original.icon] || iconsModule.HelpCircle;
            return <Icon className="h-5 w-5" />;
        },
    },
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
