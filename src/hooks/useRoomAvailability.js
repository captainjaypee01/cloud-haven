import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { useMemo, useCallback } from "react";
import { useDebounce } from "./useDebounce";

/**
 * Hook to fetch room availability with debouncing for date changes
 * 
 * @param {string} roomTypeId - Room slug/identifier
 * @param {string} checkIn - Check-in date (YYYY-MM-DD)
 * @param {string} checkOut - Check-out date (YYYY-MM-DD)
 * @param {Object} options - Additional options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {boolean} options.enabled - Whether to enable the query
 * 
 * @returns {Object} Query result with availability data
 */
export const useRoomAvailability = (roomTypeId, checkIn, checkOut, options = {}) => {
    const api = useApi();
    const { debounceMs = 300, enabled = true, ...queryOptions } = options;

    // Debounce the date inputs to prevent excessive API calls
    const debouncedCheckIn = useDebounce(checkIn, debounceMs);
    const debouncedCheckOut = useDebounce(checkOut, debounceMs);

    // Validate dates
    const datesValid = useMemo(() => {
        if (!debouncedCheckIn || !debouncedCheckOut || !roomTypeId) return false;
        
        const checkInDate = new Date(debouncedCheckIn);
        const checkOutDate = new Date(debouncedCheckOut);
        
        // Check if dates are valid and check-out is after check-in
        return (
            !isNaN(checkInDate.getTime()) &&
            !isNaN(checkOutDate.getTime()) &&
            checkOutDate > checkInDate
        );
    }, [debouncedCheckIn, debouncedCheckOut, roomTypeId]);

    // Query function to fetch availability
    const fetchAvailability = useCallback(async () => {
        const response = await api.get(
            `${API_PREFIX}/user/rooms/${roomTypeId}/availability`,
            {
                params: {
                    check_in: debouncedCheckIn,
                    check_out: debouncedCheckOut,
                },
            }
        );
        return response.data;
    }, [api, roomTypeId, debouncedCheckIn, debouncedCheckOut]);

    // React Query for caching and state management
    const query = useQuery({
        queryKey: ["room-availability", roomTypeId, debouncedCheckIn, debouncedCheckOut],
        queryFn: fetchAvailability,
        enabled: enabled && datesValid,
        staleTime: 30_000, // Consider data stale after 30 seconds
        gcTime: 5 * 60_000, // Keep in cache for 5 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        ...queryOptions,
    });

    return {
        ...query,
        availableUnits: query.data?.available_units ?? undefined,
        roomName: query.data?.room_name ?? undefined,
        isUnavailable: query.data?.available_units === 0,
        // Simplified availability data
        pending: query.data?.pending ?? 0,
        confirmed: query.data?.confirmed ?? 0,
        maintenance: query.data?.maintenance ?? 0,
        totalUnits: query.data?.total_units ?? 0,
        datesValid,
        isDebouncing: checkIn !== debouncedCheckIn || checkOut !== debouncedCheckOut,
    };
};
