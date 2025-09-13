import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import * as roomsSvc from "@/services/rooms";
import { useCart } from "../context/CartContext";
import { createGetParameters } from "../utils/urlParams";

/*** public ***/
export const useRooms = () => {
    const api = useApi();
    const { state } = useCart();
    const { checkIn, checkOut }  = state;
    const params = createGetParameters({check_in: checkIn, check_out: checkOut});
    return useQuery({
        queryKey: ["rooms", checkIn, checkOut], // Include dates in cache key
        queryFn: () => roomsSvc.listRooms(api, params),
        staleTime: 30_000, gcTime: 5 * 60_000, // Reduce stale time to 30 seconds for faster updates
    });
};

export const useRoom = (id) => {
    const api = useApi();
    return useQuery({
        queryKey: ["rooms", id],
        enabled: !!id,
        queryFn: async () => {
            try {
                return await roomsSvc.showRoom(api, id);
            } catch (err) {
                if (err.response?.status === 404) {
                    const custom = new Error(err.response.data.error);
                    custom.status = 404;
                    throw custom;
                }
                throw err;
            }
        },
        staleTime: 10 * 60_000,
        retry: (count, error) => error.status !== 404 && count < 2,
        onError: (error) => {
            // e.g., show toast or log
            console.error("Error fetching room:", error.message);
        },
    });
};

// Removed unused useAvailability hook - replaced by useRoomAvailability

/*** admin CRUD ***/
export const useCreateRoom = () => {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => roomsSvc.createRoom(api, body),
        onSuccess: () => qc.invalidateQueries(["rooms"]), // refresh list
    });
};
