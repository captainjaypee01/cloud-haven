// src/hooks/api/useMealDateRangesApi.js
import { useState, useEffect } from 'react';
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";

export const useMealDateRangesApi = () => {
    const api = useApi();
    return {
        // Meal date ranges (no auth required)
        getDateRanges: () => api.get(`${API_PREFIX}/meals/date-ranges`),
    };
};

// Legacy hook that calls API directly - DEPRECATED
// Use useMealDateRangesContext from MealDateRangesContext instead
export const useMealDateRanges = () => {
    console.warn('useMealDateRanges is deprecated. Use useMealDateRangesContext from MealDateRangesContext instead to avoid multiple API calls.');
    
    const [dateRanges, setDateRanges] = useState([]);
    const [hasActivePrograms, setHasActivePrograms] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mealDateRangesApi = useMealDateRangesApi();

    const fetchDateRanges = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await mealDateRangesApi.getDateRanges();
            const data = response.data;
            
            setDateRanges(data.ranges || []);
            setHasActivePrograms(data.has_active_programs || false);
        } catch (err) {
            setError(err.message);
            setDateRanges([]);
            setHasActivePrograms(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDateRanges();
    }, []);

    return {
        dateRanges,
        hasActivePrograms,
        loading,
        error,
        refetch: fetchDateRanges
    };
};
