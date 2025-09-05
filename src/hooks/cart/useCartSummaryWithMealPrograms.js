import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { differenceInDays, parseISO } from "date-fns";
import { useApi } from "../useApi";
import { API_PREFIX } from "../../constants/api";

export function useCartSummaryWithMealPrograms() {
    const { state: { items, checkIn, checkOut } } = useCart();
    const [mealQuote, setMealQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const api = useApi();

    const numNights =
        checkIn && checkOut
            ? Math.max(differenceInDays(parseISO(checkOut), parseISO(checkIn)), 1)
            : 1;

    const summary = items.map(item => {
        const totalGuests = item.adults + item.children;
        const extraGuests = Math.max(totalGuests - item.maxGuests, 0);
        const subtotal = item.price * numNights;  // just room cost
        return {
            ...item,
            subtotal,
            extraGuests,
            totalGuests,
            numNights,
        };
    });

    const totalGuests = summary.reduce((acc, item) => acc + item.totalGuests, 0);
    const totalAdults = summary.reduce((acc, item) => acc + item.adults, 0);
    const totalChildren = summary.reduce((acc, item) => acc + item.children, 0);
    const roomTotalPrice = summary.reduce((acc, item) => acc + item.subtotal, 0);

    useEffect(() => {
        if (checkIn && checkOut && totalAdults > 0) {
            fetchMealQuote();
        } else {
            setMealQuote(null);
        }
    }, [checkIn, checkOut, totalAdults, totalChildren]);

    const fetchMealQuote = async () => {
        try {
            setLoading(true);
            const response = await api.post(`${API_PREFIX}/public/quotes/meal`, {
                check_in: checkIn,
                check_out: checkOut,
                adults: totalAdults,
                children: totalChildren,
            });

            if (response.data.success) {
                setMealQuote(response.data.data);
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
    };
}
