// src/hooks/api/useBookingsAdminApi.js
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useBookingsAdminApi = () => {
  const api = useApi();
  return {
    calendar: (params) =>
      api.get(`${API_PREFIX}/admin/bookings/calendar`, {
        params,
        requiresAuth: true,
      }),
  };
};

