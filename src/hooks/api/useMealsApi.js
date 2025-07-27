// src/hooks/useMealsApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useMealsApi = () => {
    const api = useApi();
    return {
        list: (params) => api.get(`${API_PREFIX}/admin/meal-prices`, { params, requiresAuth: true }),
        create: (data) => api.post(`${API_PREFIX}/admin/meal-prices`, data, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/meal-prices/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/meal-prices/${id}`, { requiresAuth: true }),
    };
};
