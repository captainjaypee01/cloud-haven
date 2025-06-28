import { API_PREFIX } from "@/constants/api";

export const getMealPrice = (api) => api.get(`${API_PREFIX}/meal-prices/`).then(r => r.data);