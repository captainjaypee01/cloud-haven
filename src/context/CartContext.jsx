import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useStickyState } from '@/hooks/useStickyState';
import { toast } from 'sonner';
import { useAppContext } from './AppContext';
import { useApi } from '@/hooks/useApi';
import { fetchCurrentDayTourPricing, fetchDayTourMealProgram } from '@/services/dayTour';

const CartCtx = createContext();

function reducer(state, action) {
    switch (action.type) {
        case 'SET_DATES':
            return (action.from !== state.checkIn || action.to !== state.checkOut)
                ? { ...state, checkIn: action.from, checkOut: action.to, items: [] }
                : state;
        case 'SET_DAY_TOUR_DATE':
            return (action.date !== state.dayTourDate)
                ? { ...state, dayTourDate: action.date, items: [] }
                : state;
        case 'ADD':
            const addedAt = Date.now();
            const timestampId = `${action.room.roomId}-${addedAt}`;
            const newItem = { ...action.room, uniqueId: timestampId, addedAt: new Date(addedAt) };
            return { ...state, items: [...state.items, newItem] };
        case 'REMOVE':
            return { ...state, items: state.items.filter(i => i.uniqueId !== action.uniqueId) };
        case 'UPDATE':
            return {
                ...state,
                items: state.items.map(i =>
                    i.uniqueId === action.uniqueId ? { ...i, ...action.changes } : i
                ),
            };
        case 'CLEAR':
            return { checkIn: '', checkOut: '', dayTourDate: '', items: [] };
        default:
            return state;
    }
}

export const CartProvider = ({ children }) => {
    const [stickyDates, setStickyDates] = useStickyState(
        { checkIn: '', checkOut: '', dayTourDate: '' },
        'booking-dates'
    );
    const { navigate } = useAppContext();
    const api = useApi();
    
    // Day Tour specific data
    const [currentPricing, setCurrentPricing] = useState(null);
    const [mealProgram, setMealProgram] = useState(null);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [mealLoading, setMealLoading] = useState(false);
    
    const [state, dispatch] = useReducer(
        reducer,
        undefined,
        () => {
            const saved = localStorage.getItem("cart");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch { }
            }
            return { ...stickyDates, items: [] };
        }
    );

    // inside CartProvider:
    const updateItem = (uniqueId, changes) => {
        dispatch({ type: 'UPDATE', uniqueId, changes });

        toast.success('Cart updated'); // or toast.success
    }

    const removeItem = (uniqueId) => {
        dispatch({ type: 'REMOVE', uniqueId });
        toast.success('Removed from cart');
    }

    const addItem = room => {
        dispatch({ type: 'ADD', room });
        toast.success(`Added "${room.name}" to cart`, {
            action: {
                label: 'View Cart',
                onClick: () => navigate('/cart')
            }
        });
    }

    // Sync the date part back to localStorage
    useEffect(() => {
        setStickyDates({ checkIn: state.checkIn, checkOut: state.checkOut, dayTourDate: state.dayTourDate });
    }, [state.checkIn, state.checkOut, state.dayTourDate]);

    // Persist cart too
    useEffect(() => localStorage.setItem('cart', JSON.stringify(state)), [state]);

    // Fetch Day Tour data when Day Tour date changes
    useEffect(() => {
        if (state.dayTourDate) {
            fetchDayTourData(state.dayTourDate);
        } else {
            // Clear Day Tour data when no date is set
            setCurrentPricing(null);
            setMealProgram(null);
        }
    }, [state.dayTourDate]);

    const setDayTourDate = (date) => {
        dispatch({ type: 'SET_DAY_TOUR_DATE', date });
    };

    // Fetch Day Tour pricing for a specific date
    const fetchDayTourPricing = async (date) => {
        if (!date) return;
        
        setPricingLoading(true);
        try {
            const pricingData = await fetchCurrentDayTourPricing(api, date);
            setCurrentPricing(pricingData);
        } catch (error) {
            console.error('Failed to fetch Day Tour pricing:', error);
            setCurrentPricing(null);
        } finally {
            setPricingLoading(false);
        }
    };

    // Fetch Day Tour meal program for a specific date
    const fetchDayTourMealProgramData = async (date) => {
        if (!date) return;
        
        setMealLoading(true);
        try {
            const mealData = await fetchDayTourMealProgram(api, date);
            setMealProgram(mealData);
        } catch (error) {
            console.error('Failed to fetch Day Tour meal program:', error);
            setMealProgram(null);
        } finally {
            setMealLoading(false);
        }
    };

    // Fetch both pricing and meal program data
    const fetchDayTourData = async (date) => {
        if (!date) return;
        
        await Promise.all([
            fetchDayTourPricing(date),
            fetchDayTourMealProgramData(date)
        ]);
    };

    return (
        <CartCtx.Provider value={{
            state, dispatch,
            updateItem,
            removeItem,
            addItem,
            setDayTourDate,
            clear: () => dispatch({ type: 'CLEAR' }),
            // Day Tour specific data and functions
            currentPricing,
            mealProgram,
            pricingLoading,
            mealLoading,
            fetchDayTourData,
            fetchDayTourPricing,
            fetchDayTourMealProgramData,
        }}>
            {children}
        </CartCtx.Provider>
    );
};

export const useCart = () => useContext(CartCtx);
