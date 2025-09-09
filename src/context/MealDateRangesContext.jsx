import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMealDateRangesApi } from "@/hooks/api/useMealDateRangesApi";

const MealDateRangesContext = createContext();

export const MealDateRangesProvider = ({ children }) => {
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

    const value = {
        dateRanges,
        hasActivePrograms,
        loading,
        error,
        refetch: fetchDateRanges
    };

    return (
        <MealDateRangesContext.Provider value={value}>
            {children}
        </MealDateRangesContext.Provider>
    );
};

export const useMealDateRangesContext = () => {
    const context = useContext(MealDateRangesContext);
    if (!context) {
        throw new Error('useMealDateRangesContext must be used within a MealDateRangesProvider');
    }
    return context;
};
