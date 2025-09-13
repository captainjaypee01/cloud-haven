import { API_PREFIX } from "@/constants/api";
export const listRooms = (api, params) => api.get(`${API_PREFIX}/rooms${params}`).then(r => r.data);
export const showRoom = (api, id) => api.get(`${API_PREFIX}/rooms/${id}`).then(r => r.data);
// Removed unused checkAvailability function - replaced by individual room availability endpoint

// admin CRUD
export const createRoom = (api, body) =>
    api.post(`${API_PREFIX}/admin/rooms`, body, { requiresAuth: true }).then(r => r.data);
export const updateRoom = (api, id, body) =>
    api.put(`${API_PREFIX}/admin/rooms/${id}`, body, { requiresAuth: true }).then(r => r.data);
export const deleteRoom = (api, id) =>
    api.delete(`${API_PREFIX}/admin/rooms/${id}`, { requiresAuth: true }).then(r => r.data);
