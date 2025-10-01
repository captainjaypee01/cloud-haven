import { useState, useEffect } from "react";
import { useApi } from "../useApi";
import { API_PREFIX } from "../../constants/api";
import { parseISO, addDays, format } from "date-fns";

export function useWalkInMealCalculation(bookingType, nights, selectedRooms, checkInDate = null, checkOutDate = null) {
    const [mealQuote, setMealQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const api = useApi();

    useEffect(() => {
        if (bookingType === 'overnight' && nights && selectedRooms.length > 0) {
            fetchMealQuote();
        } else {
            setMealQuote(null);
        }
    }, [bookingType, nights, selectedRooms, checkInDate, checkOutDate]);

    const fetchMealQuote = async () => {
        try {
            setLoading(true);
            
            // Use provided dates or fallback to current date calculation
            const now = new Date();
            const today = checkInDate || format(now, 'yyyy-MM-dd');
            const checkoutDate = checkOutDate || format(addDays(now, nights), 'yyyy-MM-dd');
            
            console.log('WalkIn Meal Quote API call:', { 
                check_in: today, 
                check_out: checkoutDate, 
                nights,
                providedCheckIn: checkInDate,
                providedCheckOut: checkOutDate,
                currentTime: now.toISOString()
            });
            
            const response = await api.post(`${API_PREFIX}/meals/quote`, {
                check_in: today,
                check_out: checkoutDate
            });
            
            if (response.data) {
                console.log('WalkIn Meal Quote API response:', response.data);
                setMealQuote(response.data);
            }
        } catch (error) {
            console.error("Error fetching meal quote:", error);
            setMealQuote(null);
        } finally {
            setLoading(false);
        }
    };

    // Calculate meal costs using the same logic as useCartSummaryWithMealPrograms
    const calculateMealCosts = () => {
        if (!mealQuote?.nights || !Array.isArray(mealQuote.nights) || selectedRooms.length === 0) {
            return { 
                mealCost: 0, 
                extraGuestFeeTotal: 0, 
                detailedBreakdown: [], 
                summaryWithMealBreakdown: selectedRooms 
            };
        }

        // Get the dates for the booking (use same logic as API call)
        const now = new Date();
        const today = checkInDate || format(now, 'yyyy-MM-dd');
        const checkoutDate = checkOutDate || format(addDays(now, nights), 'yyyy-MM-dd');

        // Transform selectedRooms to match the summary structure used in guest cart
        const summary = selectedRooms.map(roomItem => ({
            ...roomItem,
            adults: roomItem.adults || 0,
            children: roomItem.children || 0,
            maxGuests: parseInt(roomItem.max_guests) || 2, // Convert to maxGuests format
            totalGuests: (roomItem.adults || 0) + (roomItem.children || 0)
        }));

        // Calculate total guests across all selected rooms for overall summary
        const totalAdults = summary.reduce((acc, item) => acc + item.adults, 0);
        const totalChildren = summary.reduce((acc, item) => acc + item.children, 0);

        let totalMealCost = 0;
        let totalExtraGuestFees = 0;
        const detailedBreakdown = [];

        // Add meal breakdown to each cart item (following exact guest cart logic)
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
                } else if (night.type === 'free_breakfast') {
                    // Free breakfast: charge extra guests if any, but always show breakdown
                    if (hasExtraGuests) {
                        roomBreakfastCost = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                        roomNightCost = roomBreakfastCost;
                    } else {
                        roomNightCost = 0; // No cost for complimentary breakfast
                    }
                    showBreakdown = true; // Always show breakdown for free breakfast days
                }

                roomMealTotal += roomNightCost;

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
                        checkIn: today,
                        checkOut: checkOutDate,
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
                roomMealTotal: roomMealTotal,
                hasRoomMealBreakdown: roomMealBreakdown.length > 0
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
            totalExtraGuestFees += extraGuestFeeTotal;
            
            detailedBreakdown.push({
                ...night,
                night_total: nightTotal,
                breakfast_total: breakfastTotal,
                extra_guest_fee_total: extraGuestFeeTotal,
                extra_adults: extraAdults,
                extra_children: extraChildren,
                adults: totalAdults,
                children: totalChildren,
                checkIn: today,
                checkOut: checkOutDate
            });
        });

        return { 
            mealCost: totalMealCost, 
            extraGuestFeeTotal: totalExtraGuestFees, 
            detailedBreakdown, 
            summaryWithMealBreakdown 
        };
    };

    const { mealCost, extraGuestFeeTotal, detailedBreakdown, summaryWithMealBreakdown } = calculateMealCosts();
    
    // Update mealQuote with calculated values for display
    const calculatedMealQuote = mealQuote ? {
        ...mealQuote,
        nights: detailedBreakdown,
        meal_subtotal: mealCost
    } : null;

    return {
        mealQuote: calculatedMealQuote,
        mealCost,
        extraGuestFeeTotal,
        summaryWithMealBreakdown,
        mealLoading: loading,
    };
}
