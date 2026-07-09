import { API_PREFIX } from "@/constants/api";

export const fetchPricingCalendar = (api, roomId, month) =>
    api.get(`${API_PREFIX}/admin/rooms/${roomId}/pricing/calendar`, {
        params: { month },
        requiresAuth: true,
    }).then(r => r.data?.data ?? r.data);

export const previewPricingBulk = (api, roomId, payload) =>
    api.post(`${API_PREFIX}/admin/rooms/${roomId}/pricing/calendar/preview`, payload, {
        requiresAuth: true,
    }).then(r => r.data?.data ?? r.data);

export const updatePricingCalendar = (api, roomId, payload) =>
    api.put(`${API_PREFIX}/admin/rooms/${roomId}/pricing/calendar`, payload, {
        requiresAuth: true,
    }).then(r => r.data?.data ?? r.data);

export const deletePricingDay = (api, roomId, date) =>
    api.delete(`${API_PREFIX}/admin/rooms/${roomId}/pricing/calendar/${date}`, {
        requiresAuth: true,
    }).then(r => r.data);

export const fetchOvernightQuote = (api, payload) =>
    api.post(`${API_PREFIX}/quotes/overnight`, payload).then(r => r.data?.data ?? r.data);

export const fetchRevenueReport = (api, params) =>
    api.get(`${API_PREFIX}/admin/room-pricing/revenue-report`, {
        params,
        requiresAuth: true,
    }).then(r => r.data?.data ?? r.data);
