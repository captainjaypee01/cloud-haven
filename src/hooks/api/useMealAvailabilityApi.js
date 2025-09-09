// src/hooks/api/useMealAvailabilityApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useMealAvailabilityApi = () => {
    const api = useApi();
    return {
        // Public meal availability (no auth required)
        getAvailability: (params) => api.get(`${API_PREFIX}/meals/availability`, { params }),
        getQuote: (data) => api.post(`${API_PREFIX}/meals/quote`, data),
    };
};
