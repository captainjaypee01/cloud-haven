// hooks/useAmenitiesApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useAmenitiesApi = () => {
    const api = useApi();

    return {
        list: (params) => api.get(`${API_PREFIX}/admin/amenities`, { params, requiresAuth: true },),
        create: (data) => api.post(`${API_PREFIX}/admin/amenities`, data, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/amenities/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/amenities/${id}`, { requiresAuth: true }),
        updateStatus: (id, status) =>
            api.patch(`${API_PREFIX}/admin/amenities/${id}/status`, { status }, { requiresAuth: true }),
    };
};
