import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }) {
    let color = "bg-gray-400";
    if (status === "paid") color = "bg-green-600";
    else if (status === "pending") color = "bg-yellow-500";
    else if (status === "downpayment") color = "bg-blue-500";
    else if (status === "cancelled") color = "bg-red-600";
    else if (status === "failed") color = "bg-red-500";
    return (
        <Badge className={`text-white ${color}`}>{status.toUpperCase()}</Badge>
    );
}
