import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'sonner';

const PromoCodeCtx = createContext();

function promoCodeReducer(state, action) {
    switch (action.type) {
        case 'SET_PROMO_CODE':
            return { ...state, promoCode: action.promoCode };
        case 'SET_PROMO_INFO':
            return { ...state, promoInfo: action.promoInfo };
        case 'SET_PROMO_ERROR':
            return { ...state, promoError: action.promoError };
        case 'CLEAR_PROMO':
            return { ...state, promoCode: '', promoInfo: null, promoError: '' };
        case 'LOAD_FROM_STORAGE':
            return { ...state, ...action.data };
        default:
            return state;
    }
}

export const PromoCodeProvider = ({ children }) => {
    const [state, dispatch] = useReducer(promoCodeReducer, {
        promoCode: '',
        promoInfo: null,
        promoError: ''
    });

    // Load promo code from localStorage on mount
    useEffect(() => {
        const savedPromoCode = localStorage.getItem('cart_promo_code');
        const savedPromoInfo = localStorage.getItem('cart_promo_info');
        
        const data = {};
        if (savedPromoCode) {
            data.promoCode = savedPromoCode;
        }
        if (savedPromoInfo) {
            try {
                data.promoInfo = JSON.parse(savedPromoInfo);
            } catch (e) {
                console.error('Error parsing saved promo info:', e);
            }
        }
        
        if (Object.keys(data).length > 0) {
            dispatch({ type: 'LOAD_FROM_STORAGE', data });
        }
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (state.promoCode) {
            localStorage.setItem('cart_promo_code', state.promoCode);
        } else {
            localStorage.removeItem('cart_promo_code');
        }
    }, [state.promoCode]);

    useEffect(() => {
        if (state.promoInfo) {
            localStorage.setItem('cart_promo_info', JSON.stringify(state.promoInfo));
        } else {
            localStorage.removeItem('cart_promo_info');
        }
    }, [state.promoInfo]);

    const setPromoCode = (promoCode) => {
        dispatch({ type: 'SET_PROMO_CODE', promoCode });
    };

    const setPromoInfo = (promoInfo) => {
        dispatch({ type: 'SET_PROMO_INFO', promoInfo });
    };

    const setPromoError = (promoError) => {
        dispatch({ type: 'SET_PROMO_ERROR', promoError });
    };

    const clearPromo = (showToast = true) => {
        dispatch({ type: 'CLEAR_PROMO' });
        if (showToast) {
            toast.success("Promo code removed.");
        }
    };

    // Helper function to calculate per-night discount
    const calculatePerNightDiscount = (promo, bookingDates, roomTotalPrice, mealCost, grandTotal) => {
        const checkIn = new Date(bookingDates.checkIn);
        const checkOut = new Date(bookingDates.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const perNightRoom = roomTotalPrice / nights;
        const perNightMeal = mealCost / nights;
        const perNightTotal = grandTotal / nights;
        
        let totalDiscount = 0;
        const breakdown = [];
        
        for (let i = 0; i < nights; i++) {
            const currentDate = new Date(checkIn);
            currentDate.setDate(checkIn.getDate() + i);
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            
            const isEligible = !promo.excluded_days || !promo.excluded_days.includes(dayOfWeek);
            
            let nightDiscount = 0;
            if (isEligible) {
                let baseAmount = perNightTotal;
                if (promo.scope === 'room') {
                    baseAmount = perNightRoom;
                } else if (promo.scope === 'meal') {
                    baseAmount = perNightMeal;
                }
                
                if (promo.discount_type === 'percentage') {
                    nightDiscount = baseAmount * (promo.discount_value / 100);
                } else {
                    nightDiscount = Math.min(promo.discount_value, baseAmount);
                }
            }
            
            totalDiscount += nightDiscount;
            
            breakdown.push({
                date: currentDate.toISOString().split('T')[0],
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                eligible: isEligible,
                baseAmount: promo.scope === 'room' ? perNightRoom : promo.scope === 'meal' ? perNightMeal : perNightTotal,
                discountAmount: nightDiscount
            });
        }
        
        return {
            totalDiscount: Math.round(totalDiscount * 100) / 100,
            breakdown
        };
    };

    const applyPromo = async (api, promoCode, roomTotalPrice, mealCost, grandTotal, bookingDates = {}) => {
        setPromoError("");
        if (!promoCode) return;
        
        try {
            // Build query parameters for booking dates
            const queryParams = new URLSearchParams();
            if (bookingDates.checkIn) queryParams.append('check_in_date', bookingDates.checkIn);
            if (bookingDates.checkOut) queryParams.append('check_out_date', bookingDates.checkOut);
            if (bookingDates.dayTourDate) queryParams.append('day_tour_date', bookingDates.dayTourDate);
            
            const queryString = queryParams.toString();
            const url = `/api/v1/promos/${promoCode}${queryString ? `?${queryString}` : ''}`;
            
            const res = await api.get(url);
            const promo = res.data;
            
            // Note: Day Tour scope validation is now handled by the backend API
            // The backend will return an error if a non-total scope promo is used for Day Tour bookings
            
            // Compute discount based on promo.scope and per-night calculation
            let discountAmount = 0;
            let perNightBreakdown = null;
            
            if (promo.per_night_calculation && bookingDates.checkIn && bookingDates.checkOut) {
                // Calculate per-night discount
                const result = calculatePerNightDiscount(promo, bookingDates, roomTotalPrice, mealCost, grandTotal);
                discountAmount = result.totalDiscount;
                perNightBreakdown = result.breakdown;
            } else {
                // Traditional calculation (entire booking)
                if (promo.discount_type === 'percentage') {
                    if (promo.scope === 'room') {
                        discountAmount = roomTotalPrice * (promo.discount_value / 100);
                    } else if (promo.scope === 'meal') {
                        discountAmount = mealCost * (promo.discount_value / 100);
                    } else { // 'total'
                        discountAmount = grandTotal * (promo.discount_value / 100);
                    }
                } else if (promo.discount_type === 'fixed') {
                    if (promo.scope === 'room') {
                        discountAmount = Math.min(promo.discount_value, roomTotalPrice);
                    } else if (promo.scope === 'meal') {
                        discountAmount = Math.min(promo.discount_value, mealCost);
                    } else {
                        discountAmount = Math.min(promo.discount_value, grandTotal);
                    }
                }
            }
            
            discountAmount = Math.round(discountAmount * 100) / 100; // round to 2 decimals
            
            setPromoInfo({ 
                ...promo, 
                discountAmount,
                perNightBreakdown 
            });
            toast.success(`Promo code "${promo.code}" applied successfully!`);
        } catch (err) {
            console.error(err);
            setPromoInfo(null);
            if (err.response?.status === 404) {
                setPromoError("Promo code not found.");
            } else {
                setPromoError(err.response?.data?.message || "Promo code invalid.");
            }
        }
    };

    const value = {
        ...state,
        setPromoCode,
        setPromoInfo,
        setPromoError,
        clearPromo,
        applyPromo
    };

    return (
        <PromoCodeCtx.Provider value={value}>
            {children}
        </PromoCodeCtx.Provider>
    );
};

export const usePromoCode = () => {
    const context = useContext(PromoCodeCtx);
    if (!context) {
        throw new Error('usePromoCode must be used within a PromoCodeProvider');
    }
    return context;
};
