// src/hooks/usePromosApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const usePromosApi = () => {
    const api = useApi();
    return {
        list: (params) => api.get(`${API_PREFIX}/admin/promos`, { params, requiresAuth: true }),
        create: (data) => api.post(`${API_PREFIX}/admin/promos`, data, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/promos/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/promos/${id}`, { requiresAuth: true }),
        updateStatus: (id, status) =>
            api.patch(`${API_PREFIX}/admin/promos/${id}/update-status`, { status }, { requiresAuth: true }),
        bulkUpdateStatus: (ids, status) =>
            api.patch(`${API_PREFIX}/admin/promos/bulk-update-status`, { ids, status }, { requiresAuth: true }),
        /**
     * Set or unset a promo as exclusive.  Passing `exclusive=true` will
     * attempt to mark the promo as one of the exclusive homepage offers.
     * The backend enforces a limit on the number of exclusive promos
     * configured via environment variables.  When the limit is reached
     * additional promos cannot be marked exclusive and an error will be
     * returned.
     *
     * @param {number} id The id of the promo to update
     * @param {boolean} exclusive Whether the promo should be exclusive
     */
        updateExclusive: (id, exclusive) =>
            api.patch(
                `${API_PREFIX}/admin/promos/${id}/update-exclusive`,
                { exclusive },
                { requiresAuth: true }
            ),
    };
};
