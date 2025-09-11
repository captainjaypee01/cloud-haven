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
        if (!isDayTourCart && checkIn && checkOut) {
            fetchMealQuote();
        } else {
            setMealQuote(null);
        }
    }, [isDayTourCart, checkIn, checkOut]);

    const fetchMealQuote = async () => {
        try {
            setLoading(true);
            
            const response = await api.post(`${API_PREFIX}/meals/quote`, {
                check_in: checkIn,
                check_out: checkOut
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

    // Calculate meal costs on frontend using simplified API data
    const calculateMealCosts = () => {
        if (!mealQuote?.nights || !Array.isArray(mealQuote.nights)) {
            return { mealCost: 0, detailedBreakdown: [], summaryWithMealBreakdown: summary };
        }

        let totalMealCost = 0;
        const detailedBreakdown = [];

        // Add meal breakdown to each cart item
        const summaryWithMealBreakdown = summary.map(item => {
            const roomMealBreakdown = [];
            let roomMealTotal = 0;

            mealQuote.nights.forEach(night => {
                let roomNightCost = 0;
                let roomBreakfastCost = 0;
                let hasExtraGuests = false;
                let showBreakdown = false;

                const totalGuestsInRoom = item.adults + item.children;
                const maxGuests = parseInt(item.maxGuests) || 2;
                const extraGuestsInRoom = Math.max(0, totalGuestsInRoom - maxGuests);
                hasExtraGuests = extraGuestsInRoom > 0;

                if (night.type === 'buffet') {
                    // Buffet: charge all guests in this room
                    roomNightCost = (item.adults * (night.adult_price || 0)) + (item.children * (night.child_price || 0));
                    showBreakdown = true; // Always show breakdown for buffet
                } else if (night.type === 'free_breakfast' && hasExtraGuests) {
                    // Free breakfast: only charge extra guests
                    roomBreakfastCost = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                    roomNightCost = roomBreakfastCost;
                    showBreakdown = true; // Show breakdown when there are extra guests
                }

                roomMealTotal += roomNightCost;

                if (showBreakdown) {
                    roomMealBreakdown.push({
                        date: night.date,
                        type: night.type,
                        cost: roomNightCost,
                        breakfastCost: roomBreakfastCost,
                        extraGuests: extraGuestsInRoom,
                        adultPrice: night.adult_price,
                        childPrice: night.child_price,
                        adultBreakfastPrice: night.adult_breakfast_price,
                        childBreakfastPrice: night.child_breakfast_price
                    });
                }
            });

            return {
                ...item,
                mealBreakdown: roomMealBreakdown,
                roomMealTotal: roomMealTotal,
                hasRoomMealBreakdown: roomMealBreakdown.length > 0
            };
        });

        // Calculate overall breakdown for summary display
        mealQuote.nights.forEach(night => {
            let nightTotal = 0;
            let breakfastTotal = 0;
            let extraAdults = 0;
            let extraChildren = 0;

            if (night.type === 'buffet') {
                // Calculate buffet costs for all guests
                nightTotal = (totalAdults * (night.adult_price || 0)) + (totalChildren * (night.child_price || 0));
            } else if (night.type === 'free_breakfast') {
                // Calculate breakfast costs for extra guests only
                summary.forEach(item => {
                    const totalGuestsInRoom = item.adults + item.children;
                    const maxGuests = parseInt(item.maxGuests) || 2;
                    const extraGuestsInRoom = Math.max(0, totalGuestsInRoom - maxGuests);
                    
                    if (extraGuestsInRoom > 0) {
                        // Use adult breakfast price for all extra guests (simplified)
                        const roomBreakfastCost = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                        breakfastTotal += roomBreakfastCost;
                        extraAdults += extraGuestsInRoom;
                    }
                });
                nightTotal = breakfastTotal;
            }

            totalMealCost += nightTotal;
            
            detailedBreakdown.push({
                ...night,
                night_total: nightTotal,
                breakfast_total: breakfastTotal,
                extra_adults: extraAdults,
                extra_children: extraChildren,
                adults: totalAdults,
                children: totalChildren
            });
        });

        return { mealCost: totalMealCost, detailedBreakdown, summaryWithMealBreakdown };
    };

    const { mealCost, detailedBreakdown, summaryWithMealBreakdown } = calculateMealCosts();
    const grandTotal = roomTotalPrice + mealCost;
    
    // Update mealQuote with calculated values for display
    const calculatedMealQuote = mealQuote ? {
        ...mealQuote,
        nights: detailedBreakdown,
        meal_subtotal: mealCost
    } : null;

    return {
        checkIn,
        checkOut,
        summary: summaryWithMealBreakdown,
        grandTotal,
        totalGuests,
        numNights,
        totalAdults,
        totalChildren,
        mealCost,
        roomTotalPrice,
        mealQuote: calculatedMealQuote,
        mealLoading: loading,
        isDayTourCart,
    };
}
