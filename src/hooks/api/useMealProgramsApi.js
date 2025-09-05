// src/hooks/api/useMealProgramsApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useMealProgramsApi = () => {
    const api = useApi();
    return {
        // Meal Programs CRUD
        list: (params) => api.get(`${API_PREFIX}/admin/meal-programs`, { params, requiresAuth: true }),
        create: (data) => api.post(`${API_PREFIX}/admin/meal-programs`, data, { requiresAuth: true }),
        show: (id) => api.get(`${API_PREFIX}/admin/meal-programs/${id}`, { requiresAuth: true }),
        update: (id, data) => api.put(`${API_PREFIX}/admin/meal-programs/${id}`, data, { requiresAuth: true }),
        remove: (id) => api.delete(`${API_PREFIX}/admin/meal-programs/${id}`, { requiresAuth: true }),
        preview: (id, params) => api.get(`${API_PREFIX}/admin/meal-programs/${id}/preview`, { params, requiresAuth: true }),

        // Pricing Tiers
        createPricingTier: (programId, data) => 
            api.post(`${API_PREFIX}/admin/meal-programs/${programId}/pricing-tiers`, data, { requiresAuth: true }),
        updatePricingTier: (programId, tierId, data) => 
            api.put(`${API_PREFIX}/admin/meal-programs/${programId}/pricing-tiers/${tierId}`, data, { requiresAuth: true }),
        removePricingTier: (programId, tierId) => 
            api.delete(`${API_PREFIX}/admin/meal-programs/${programId}/pricing-tiers/${tierId}`, { requiresAuth: true }),

        // Calendar Overrides
        createCalendarOverride: (programId, data) => 
            api.post(`${API_PREFIX}/admin/meal-programs/${programId}/overrides`, data, { requiresAuth: true }),
        updateCalendarOverride: (programId, overrideId, data) => 
            api.put(`${API_PREFIX}/admin/meal-programs/${programId}/overrides/${overrideId}`, data, { requiresAuth: true }),
        removeCalendarOverride: (programId, overrideId) => 
            api.delete(`${API_PREFIX}/admin/meal-programs/${programId}/overrides/${overrideId}`, { requiresAuth: true }),
    };
};
