import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useApi } from "../hooks/useApi";
import * as bookingsSvc from "@/services/bookings";

export const useCreateBooking = () => {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => bookingsSvc.createBooking(api, body),
        onSuccess: () => {
            // Refresh booking lists
            qc.invalidateQueries(["bookings"]);
            
            // Refresh room availability data to show updated availability immediately
            qc.invalidateQueries(["rooms"]); // Main rooms list with availability
            qc.invalidateQueries(["room-availability"]); // Individual room availability checks
        },
    });
};