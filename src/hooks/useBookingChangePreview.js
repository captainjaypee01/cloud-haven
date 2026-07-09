import { useEffect, useState } from 'react';
import { useApi } from './useApi';
import { API_PREFIX } from '@/constants/api';

export function useBookingChangePreview(bookingId, changeType, params, enabled = true) {
    const api = useApi();
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const paramsKey = JSON.stringify(params ?? null);

    useEffect(() => {
        if (!enabled || !bookingId || !changeType || !params) {
            setPreview(null);
            setError(null);
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.post(
                    `${API_PREFIX}/admin/bookings/${bookingId}/change-preview`,
                    { change_type: changeType, ...params },
                    { requiresAuth: true }
                );
                if (!cancelled) {
                    setPreview(response?.data?.data ?? response?.data ?? null);
                }
            } catch (err) {
                if (!cancelled) {
                    setPreview(null);
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [api, bookingId, changeType, paramsKey, enabled]);

    return { preview, loading, error };
}
