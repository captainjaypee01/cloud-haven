// components/admin/Table/reviewColumns.jsx
import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const reviewColumns = [
    {
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    ID
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
    },
    {
        accessorKey: "reviewer_name",
        header: "Reviewer",
        cell: info => {
            const row = info.row.original;
            if (row.user) {
                return `${row.user.first_name} ${row.user.last_name}`;
            } else if (row.first_name || row.last_name) {
                return `${row.first_name || ''} ${row.last_name || ''}`.trim();
            }
            return "Anonymous";
        },
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: info => {
            const map = { 
                "room": "Room", 
                "resort": "Resort" 
            };
            return map[info.getValue()] || "Room";
        },
    },
    {
        accessorKey: "rating",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    Rating
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
        cell: info => {
            const rating = info.getValue();
            return "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating}/5)`;
        },
    },
    {
        accessorKey: "comment",
        header: "Comment",
        cell: info => {
            const comment = info.getValue();
            return comment.length > 60 ? comment.substring(0, 60) + "..." : comment;
        },
    },
    {
        accessorKey: "room",
        header: "Room",
        cell: info => {
            const room = info.row.original.room;
            return room ? room.name : "-";
        },
    },
    {
        accessorKey: "booking",
        header: "Booking",
        cell: info => {
            const booking = info.row.original.booking;
            return booking ? booking.reference_number : "-";
        },
    },
    {
        accessorKey: "is_testimonial",
        header: "Testimonial",
        cell: info => {
            return info.getValue() ? "⭐ Featured" : "-";
        },
    },
    {
        accessorKey: "created_at",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="flex items-center gap-1 select-none cursor-pointer"
                >
                    Date
                    {column.getIsSorted() === 'asc' && <ArrowUp />}
                    {column.getIsSorted() === 'desc' && <ArrowDown />}
                </Button>
            )
        },
        cell: info => {
            return new Date(info.getValue()).toLocaleDateString();
        },
    },
];
