// src/hooks/api/useImagesApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useImagesApi = () => {
    const api = useApi();
    return {
        list: (params) =>
            api.get(`${API_PREFIX}/admin/images`, { params, requiresAuth: true }),
        create: (formData) =>
            api.post(`${API_PREFIX}/admin/images`, formData, {
                requiresAuth: true,
            }),
        remove: (id) =>
            api.delete(`${API_PREFIX}/admin/images/${id}`, { requiresAuth: true }),
    };
};
