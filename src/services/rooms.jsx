// services/rooms.js
const API_PREFIX = "/api/v1";
export const listRooms = (api) => api.get(`${API_PREFIX}/rooms`).then(r => r.data);
export const showRoom = (api, id) => api.get(`${API_PREFIX}/rooms/${id}`).then(r => r.data);
export const checkAvailability = (api, params) => api.get(`${API_PREFIX}/availability`, { params }).then((r) => r.data);

// admin CRUD
export const createRoom = (api, body) =>
    api.post(`${API_PREFIX}/admin/rooms`, body, { requiresAuth: true }).then(r => r.data);
export const updateRoom = (api, id, body) =>
    api.put(`${API_PREFIX}/admin/rooms/${id}`, body, { requiresAuth: true }).then(r => r.data);
export const deleteRoom = (api, id) =>
    api.delete(`${API_PREFIX}/admin/rooms/${id}`, { requiresAuth: true }).then(r => r.data);
