import { API_PREFIX } from "@/constants/api";
export const listBookings = (api) => api.get(`${API_PREFIX}/bookings`).then(r => r.data);
export const createBooking = (api, data) => api.post(`${API_PREFIX}/bookings`, data).then(r => r.data);
