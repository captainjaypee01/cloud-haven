// src/hooks/api/useUsersApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useUsersApi = () => {
    const api = useApi();
    return {
        list: (params) => api.get(`${API_PREFIX}/admin/users`, { params, requiresAuth: true }),
        create: (data) => api.post(`${API_PREFIX}/admin/users`, data, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/users/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/users/${id}`, { requiresAuth: true }),
        // (No extra endpoints for users like status toggle, since activate/deactivate could be handled via delete/restore)
    };
};
