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

    // Listen for storage changes and custom events to clear promo when dates change
    useEffect(() => {
        const handleStorageChange = (e) => {
            // If promo codes are removed from localStorage, clear the state
            if (e.key === 'cart_promo_code' && e.newValue === null) {
                dispatch({ type: 'CLEAR_PROMO' });
            }
            if (e.key === 'cart_promo_info' && e.newValue === null) {
                dispatch({ type: 'CLEAR_PROMO' });
            }
        };

        const handleClearPromoCodes = () => {
            dispatch({ type: 'CLEAR_PROMO' });
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('clearPromoCodes', handleClearPromoCodes);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('clearPromoCodes', handleClearPromoCodes);
        };
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

    const clearPromoSilently = () => {
        dispatch({ type: 'CLEAR_PROMO' });
    };

    // Helper function to calculate per-night discount (legacy - simple division)
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
            
            // Check if date is eligible based on promo period and excluded days
            let isEligible = true;
            
            // Check if date falls within promo period
            if (promo.starts_at) {
                const promoStartDate = new Date(promo.starts_at);
                promoStartDate.setHours(0, 0, 0, 0);
                if (currentDate < promoStartDate) {
                    isEligible = false;
                }
            }
            
            if (promo.ends_at) {
                const promoEndDate = new Date(promo.ends_at);
                promoEndDate.setHours(0, 0, 0, 0);
                if (currentDate > promoEndDate) {
                    isEligible = false;
                }
            }
            
            // Check excluded days of the week
            if (isEligible && promo.excluded_days && promo.excluded_days.includes(dayOfWeek)) {
                isEligible = false;
            }
            
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

    // Helper function to calculate per-night discount using actual meal breakdown
    const calculatePerNightDiscountWithMealBreakdown = (promo, bookingDates, roomTotalPrice, mealCost, grandTotal, mealQuote) => {
        const checkIn = new Date(bookingDates.checkIn);
        const checkOut = new Date(bookingDates.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const perNightRoom = roomTotalPrice / nights;
        const perNightTotal = grandTotal / nights;
        
        let totalDiscount = 0;
        const breakdown = [];
        
        for (let i = 0; i < nights; i++) {
            const currentDate = new Date(checkIn);
            currentDate.setDate(checkIn.getDate() + i);
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            
            // Check if date is eligible based on promo period and excluded days
            let isEligible = true;
            
            // Check if date falls within promo period
            if (promo.starts_at) {
                const promoStartDate = new Date(promo.starts_at);
                promoStartDate.setHours(0, 0, 0, 0);
                if (currentDate < promoStartDate) {
                    isEligible = false;
                }
            }
            
            if (promo.ends_at) {
                const promoEndDate = new Date(promo.ends_at);
                promoEndDate.setHours(0, 0, 0, 0);
                if (currentDate > promoEndDate) {
                    isEligible = false;
                }
            }
            
            // Check excluded days of the week
            if (isEligible && promo.excluded_days && promo.excluded_days.includes(dayOfWeek)) {
                isEligible = false;
            }
            
            let nightDiscount = 0;
            let baseAmount = 0;
            
            if (isEligible) {
                if (promo.scope === 'room') {
                    baseAmount = perNightRoom;
                } else if (promo.scope === 'meal') {
                    // Use actual meal breakdown for this night
                    const mealNight = mealQuote?.nights?.find(night => {
                        const mealDate = new Date(night.date);
                        return mealDate.toDateString() === currentDate.toDateString();
                    });
                    
                    if (mealNight) {
                        // For meal scope, use the actual cost for this specific night
                        baseAmount = mealNight.night_total || 0;
                    }
                } else {
                    // 'total' scope
                    baseAmount = perNightTotal;
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
                baseAmount: baseAmount,
                discountAmount: nightDiscount
            });
        }
        
        return {
            totalDiscount: Math.round(totalDiscount * 100) / 100,
            breakdown
        };
    };

    const applyPromo = async (api, promoCode, roomTotalPrice, mealCost, grandTotal, bookingDates = {}, mealQuote = null) => {
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
                // Calculate per-night discount using actual meal breakdown
                const result = calculatePerNightDiscountWithMealBreakdown(promo, bookingDates, roomTotalPrice, mealCost, grandTotal, mealQuote);
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
            setPromoCode(promoCode); // Set the promo code in state
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

    // Function to recalculate promo discount when cart contents change
    const recalculatePromo = async (api, roomTotalPrice, mealCost, grandTotal, bookingDates = {}, mealQuote = null) => {
        // Only recalculate if we have an active promo
        if (!state.promoInfo) {
            return;
        }

        const promo = state.promoInfo;
        
        try {
            // Compute discount based on promo.scope and per-night calculation
            let discountAmount = 0;
            let perNightBreakdown = null;
            
            if (promo.per_night_calculation && bookingDates.checkIn && bookingDates.checkOut) {
                // Calculate per-night discount using actual meal breakdown
                const result = calculatePerNightDiscountWithMealBreakdown(promo, bookingDates, roomTotalPrice, mealCost, grandTotal, mealQuote);
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

            // Update promo info with new discount amount (silently, no toast)
            setPromoInfo({
                ...promo,
                discountAmount,
                perNightBreakdown
            });
        } catch (error) {
            console.error('Promo recalculation error:', error);
            // If recalculation fails, we could optionally clear the promo
            // clearPromo(false); // false = no toast
        }
    };

    const value = {
        ...state,
        setPromoCode,
        setPromoInfo,
        setPromoError,
        clearPromo,
        clearPromoSilently,
        applyPromo,
        recalculatePromo
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
