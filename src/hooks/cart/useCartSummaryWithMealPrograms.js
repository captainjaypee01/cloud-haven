import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { differenceInDays, parseISO } from "date-fns";
import { useApi } from "../useApi";
import { API_PREFIX } from "../../constants/api";
import { hasDayTourItems } from "../../utils/roomTypeUtils";

export function useCartSummaryWithMealPrograms() {
    const { state: { items, checkIn, checkOut } } = useCart();
    const [mealQuote, setMealQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const api = useApi();

    // Check if cart has Day Tour items
    const isDayTourCart = hasDayTourItems(items);

    const numNights =
        checkIn && checkOut
            ? Math.max(differenceInDays(parseISO(checkOut), parseISO(checkIn)), 1)
            : 1;

    const summary = items.map(item => {
        const totalGuests = item.adults + item.children;
        const calculatedExtraGuests = Math.max(totalGuests - parseInt(item.maxGuests), 0);
        
        // For Day Tour items: price is already calculated as (pricePerPax * totalGuests)
        // For overnight items: multiply by nights
        const subtotal = item.roomType === 'day_tour' ? item.price : item.price * numNights;
        
        return {
            ...item,
            subtotal,
            calculatedExtraGuests, // How many guests exceed the base limit
            totalGuests,
            numNights: item.roomType === 'day_tour' ? 1 : numNights, // Day Tour is always 1 "night" for display
            pricePerPax: item.pricePerPax, // Preserve pricePerPax for Day Tour items
        };
    });

    const totalGuests = summary.reduce((acc, item) => acc + item.totalGuests, 0);
    const totalAdults = summary.reduce((acc, item) => acc + item.adults, 0);
    const totalChildren = summary.reduce((acc, item) => acc + item.children, 0);
    const roomTotalPrice = summary.reduce((acc, item) => acc + item.subtotal, 0);

    useEffect(() => {
        // Only fetch meal quotes for overnight bookings, not Day Tour
        if (!isDayTourCart && checkIn && checkOut && totalAdults > 0) {
            fetchMealQuote();
        } else {
            setMealQuote(null);
        }
    }, [isDayTourCart, checkIn, checkOut, totalAdults, totalChildren]);

    const fetchMealQuote = async () => {
        try {
            setLoading(true);
            const response = await api.post(`${API_PREFIX}/meals/quote`, {
                check_in: checkIn,
                check_out: checkOut,
                adults: totalAdults,
                children: totalChildren,
            });
            
            // The API returns data directly without success wrapper
            if (response.data) {
                setMealQuote(response.data);
            }
        } catch (error) {
            console.error("Error fetching meal quote:", error);
            setMealQuote(null);
        } finally {
            setLoading(false);
        }
    };

    const mealCost = mealQuote?.meal_subtotal || 0;
    const grandTotal = roomTotalPrice + mealCost;

    return {
        checkIn,
        checkOut,
        summary,
        grandTotal,
        totalGuests,
        numNights,
        totalAdults,
        totalChildren,
        mealCost,
        roomTotalPrice,
        mealQuote,
        mealLoading: loading,
        isDayTourCart,
    };
}
