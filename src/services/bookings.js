import { API_PREFIX } from "@/constants/api";
export const listBookings = (api) => api.get(`${API_PREFIX}/bookings`).then(r => r.data);
export const createBooking = (api, data) => api.post(`${API_PREFIX}/bookings`, data).then(r => r.data);

// User-scoped bookings
export const listUserBookings = (api) => api.get(`${API_PREFIX}/user/bookings/user`, { requiresAuth: true }).then(r => r.data);
export const getBookingByRef = (api, ref) => api.get(`${API_PREFIX}/bookings/ref/${ref}`, { requiresAuth: true }).then(r => r.data);
export const claimBookingToUser = (api, ref) => api.patch(`${API_PREFIX}/user/bookings/ref/${ref}/claim`, {}, { requiresAuth: true }).then(r => r.data);
