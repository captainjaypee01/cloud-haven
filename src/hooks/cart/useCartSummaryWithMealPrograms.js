import { useState, useEffect, useMemo } from "react";
import { useCart } from "../../context/CartContext";
import { differenceInDays, parseISO, addDays, format } from "date-fns";
import { useApi } from "../useApi";
import { API_PREFIX } from "../../constants/api";
import { hasDayTourItems } from "../../utils/roomTypeUtils";

import { fetchOvernightQuote } from "../../services/roomPricing";

export function useCartSummaryWithMealPrograms() {
    const { state: { items, checkIn, checkOut } } = useCart();
    const [mealQuote, setMealQuote] = useState(null);
    const [roomQuote, setRoomQuote] = useState(null);
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

    const summaryWithRoomPricing = useMemo(() => {
        if (!roomQuote?.nights || isDayTourCart) {
            return summary;
        }
        const lineTotals = {};
        roomQuote.nights.forEach((night) => {
            (night.rooms || []).forEach((room) => {
                lineTotals[room.slug] = (lineTotals[room.slug] || 0) + room.rate;
            });
        });
        return summary.map((item) => ({
            ...item,
            subtotal: lineTotals[item.roomId] ?? item.subtotal,
            roomNightlyBreakdown: roomQuote.nights.map((night) => ({
                date: night.date,
                rate: (night.rooms || []).find((r) => r.slug === item.roomId)?.rate,
            })).filter((n) => n.rate != null),
        }));
    }, [summary, roomQuote, isDayTourCart]);

    const totalGuests = summaryWithRoomPricing.reduce((acc, item) => acc + item.totalGuests, 0);
    const totalAdults = summaryWithRoomPricing.reduce((acc, item) => acc + item.adults, 0);
    const totalChildren = summaryWithRoomPricing.reduce((acc, item) => acc + item.children, 0);
    const roomTotalPrice = roomQuote?.total_room ?? summaryWithRoomPricing.reduce((acc, item) => acc + item.subtotal, 0);

    useEffect(() => {
        if (!isDayTourCart && checkIn && checkOut && items.length > 0) {
            fetchQuotes();
        } else {
            setMealQuote(null);
            setRoomQuote(null);
        }
    }, [isDayTourCart, checkIn, checkOut, items.length, JSON.stringify(items.map(i => ({ id: i.roomId, a: i.adults, c: i.children })))]);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const roomsPayload = items.map(item => ({
                room_id: item.roomId,
                adults: item.adults,
                children: item.children,
            }));

            const [mealResponse, roomData] = await Promise.all([
                api.post(`${API_PREFIX}/meals/quote`, { check_in: checkIn, check_out: checkOut }),
                fetchOvernightQuote(api, {
                    check_in_date: checkIn,
                    check_out_date: checkOut,
                    rooms: roomsPayload,
                }).catch(() => null),
            ]);

            if (mealResponse.data) {
                setMealQuote(mealResponse.data);
            }
            setRoomQuote(roomData);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            setMealQuote(null);
            setRoomQuote(null);
        } finally {
            setLoading(false);
        }
    };

    // Calculate meal costs on frontend using simplified API data
    const calculateMealCosts = () => {
        if (!mealQuote?.nights || !Array.isArray(mealQuote.nights)) {
            return { mealCost: 0, extraGuestFeeTotal: 0, detailedBreakdown: [], summaryWithMealBreakdown: summary };
        }

        let totalMealCost = 0;
        let totalExtraGuestFees = 0;
        const detailedBreakdown = [];

        // Add meal breakdown to each cart item
        const summaryWithMealBreakdown = summaryWithRoomPricing.map(item => {
            const roomMealBreakdown = [];
            const roomExtraGuestBreakdown = [];
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
                    roomNightCost = (item.adults * (night.adult_price || 0)) + (item.children * (night.child_price || 0));
                    showBreakdown = true;
                } else if (night.type === 'free_breakfast') {
                    // Complimentary breakfast is free; extra-guest charges are shown separately
                    roomNightCost = 0;
                    showBreakdown = true;
                }

                roomMealTotal += roomNightCost;

                if (hasExtraGuests) {
                    if (night.type === 'free_breakfast' && (night.adult_breakfast_price || 0) > 0) {
                        const feeTotal = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                        roomExtraGuestBreakdown.push({
                            date: night.date,
                            endDate: night.end_date,
                            type: 'free_breakfast',
                            extraGuests: extraGuestsInRoom,
                            feePerGuest: night.adult_breakfast_price || 0,
                            total: feeTotal,
                        });
                    } else if (night.type === 'buffet' && (night.extra_guest_fee || 0) > 0) {
                        const feeTotal = extraGuestsInRoom * night.extra_guest_fee;
                        roomExtraGuestBreakdown.push({
                            date: night.date,
                            endDate: night.end_date,
                            type: 'buffet',
                            extraGuests: extraGuestsInRoom,
                            feePerGuest: night.extra_guest_fee,
                            total: feeTotal,
                        });
                    }
                }

                if (showBreakdown) {
                    // Use start_date from API (represents when the meal is actually consumed)
                    let displayDate;
                    if (night.start_date) {
                        // Use start_date from API (represents when they eat the meal)
                        displayDate = night.start_date;
                    } else {
                        // Fallback: Use meal service date directly
                        displayDate = night.date;
                    }

                    roomMealBreakdown.push({
                        date: displayDate, // Use start_date for display (when meal is consumed)
                        type: night.type,
                        cost: roomNightCost,
                        breakfastCost: roomBreakfastCost,
                        extraGuests: extraGuestsInRoom,
                        adultPrice: night.adult_price,
                        childPrice: night.child_price,
                        adultBreakfastPrice: night.adult_breakfast_price,
                        childBreakfastPrice: night.child_breakfast_price,
                        // Add check-in and check-out dates for buffet date formatting only
                        checkIn: checkIn,
                        checkOut: checkOut,
                        // Keep the original meal service date for reference
                        mealServiceDate: night.date,
                        // Store start and end dates for flexibility
                        startDate: night.start_date,
                        endDate: night.end_date
                    });
                }
            });

            // Sort meal breakdown by stay date to ensure correct order
            roomMealBreakdown.sort((a, b) => {
                const dateA = parseISO(a.date);
                const dateB = parseISO(b.date);
                return dateA - dateB;
            });

            return {
                ...item,
                mealBreakdown: roomMealBreakdown,
                extraGuestBreakdown: roomExtraGuestBreakdown,
                roomMealTotal,
                roomExtraGuestFeeTotal: roomExtraGuestBreakdown.reduce((sum, row) => sum + row.total, 0),
                hasRoomMealBreakdown: roomMealBreakdown.length > 0,
                hasExtraGuestBreakdown: roomExtraGuestBreakdown.length > 0,
            };
        });

        // Calculate overall breakdown for summary display
        mealQuote.nights.forEach((night, index) => {
            let nightTotal = 0;
            let breakfastTotal = 0;
            let extraGuestFeeTotal = 0;
            let extraAdults = 0;
            let extraChildren = 0;

            if (night.type === 'buffet') {
                // Calculate buffet costs for all guests
                nightTotal = (totalAdults * (night.adult_price || 0)) + (totalChildren * (night.child_price || 0));
                
                // Calculate extra guest fees for buffet days
                if (night.extra_guest_fee > 0) {
                    let totalExtraGuests = 0;
                    summary.forEach(item => {
                        const totalGuestsInRoom = item.adults + item.children;
                        const maxGuests = parseInt(item.maxGuests) || 2;
                        const extraGuestsInRoom = Math.max(0, totalGuestsInRoom - maxGuests);
                        totalExtraGuests += extraGuestsInRoom;
                    });
                    extraGuestFeeTotal = totalExtraGuests * night.extra_guest_fee;
                }
            } else if (night.type === 'free_breakfast') {
                summary.forEach(item => {
                    const totalGuestsInRoom = item.adults + item.children;
                    const maxGuests = parseInt(item.maxGuests) || 2;
                    const extraGuestsInRoom = Math.max(0, totalGuestsInRoom - maxGuests);

                    if (extraGuestsInRoom > 0) {
                        const roomFee = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                        breakfastTotal += roomFee;
                        extraAdults += extraGuestsInRoom;
                    }
                });
                extraGuestFeeTotal = breakfastTotal;
                nightTotal = 0;
            }

            totalMealCost += nightTotal;
            totalExtraGuestFees += extraGuestFeeTotal;

            detailedBreakdown.push({
                ...night,
                night_total: nightTotal,
                breakfast_total: 0,
                extra_guest_fee_total: extraGuestFeeTotal,
                extra_adults: extraAdults,
                extra_children: extraChildren,
                adults: totalAdults,
                children: totalChildren,
                // Add check-in and check-out dates for buffet date formatting only
                checkIn: checkIn,
                checkOut: checkOut
            });
        });

        return { mealCost: totalMealCost, extraGuestFeeTotal: totalExtraGuestFees, detailedBreakdown, summaryWithMealBreakdown };
    };

    const { mealCost, extraGuestFeeTotal, detailedBreakdown, summaryWithMealBreakdown } = calculateMealCosts();
    
    // For Day Tour, meal costs are already included in item.price, so don't add them again
    let finalMealCost = mealCost;
    let finalExtraGuestFeeTotal = extraGuestFeeTotal;
    if (isDayTourCart) {
        finalMealCost = 0; // Don't add meal costs separately for Day Tour
        finalExtraGuestFeeTotal = 0; // Don't add extra guest fees for Day Tour
    }
    
    const grandTotal = roomTotalPrice + finalMealCost + finalExtraGuestFeeTotal;
    
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
        mealCost: finalMealCost,
        extraGuestFeeTotal: finalExtraGuestFeeTotal,
        roomTotalPrice,
        roomQuote,
        mealQuote: calculatedMealQuote,
        mealLoading: loading,
        isDayTourCart,
    };
}
