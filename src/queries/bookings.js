import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "../hooks/useApi";
import * as bookingsSvc from "@/services/bookings";

export const useCreateBooking = () => {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => bookingsSvc.createBooking(api, body),
        onSuccess: () => qc.invalidateQueries(["bookings"]), // refresh list
    });
};