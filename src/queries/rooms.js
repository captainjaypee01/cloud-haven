import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import * as roomsSvc from "@/services/rooms";

/*** public ***/
export const useRooms = () => {
    const api = useApi();
    return useQuery({
        queryKey: ["rooms"],
        queryFn: () => roomsSvc.listRooms(api),
        staleTime: 5 * 60_000, gcTime: 30 * 60_000,        // cache knobs
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

export const useAvailability = (params) => {
    const api = useApi();
    return useQuery({
        queryKey: ["availability", params],
        enabled: !!params?.check_in && !!params?.check_out,
        queryFn: () => roomsSvc.checkAvailability(api, params),
        staleTime: 30_000, refetchInterval: 30_000,        // live polling
    });
};

/*** admin CRUD ***/
export const useCreateRoom = () => {
    const api = useApi();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => roomsSvc.createRoom(api, body),
        onSuccess: () => qc.invalidateQueries(["rooms"]), // refresh list
    });
};
