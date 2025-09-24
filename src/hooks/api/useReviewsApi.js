// src/hooks/api/useReviewsApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useReviewsApi = () => {
    const api = useApi();
    return {
        list: (params) => api.get(`${API_PREFIX}/admin/reviews`, { params, requiresAuth: true }),
        create: (data) => api.post(`${API_PREFIX}/admin/reviews`, data, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/reviews/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/reviews/${id}`, { requiresAuth: true }),
        show: (id) => api.get(`${API_PREFIX}/admin/reviews/${id}`, { requiresAuth: true }),
    };
};
