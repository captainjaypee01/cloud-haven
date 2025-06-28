import { differenceInDays, parseISO } from "date-fns";
import { FOOD_PRICE_DEFAULT_ADULT, FOOD_PRICE_DEFAULT_CHILDREN } from "../constants/AppConstant";

/**
 * Centralized calculation for cart summary and totals.
 */
export function calculateCartSummary({ items = [], checkIn, checkOut, mealPrices }) {
    const foodPriceAdult = mealPrices?.adult?.price ?? FOOD_PRICE_DEFAULT_ADULT;
    const foodPriceChildren = mealPrices?.children?.price ?? FOOD_PRICE_DEFAULT_CHILDREN;
    console.log(foodPriceAdult, foodPriceChildren);
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
    const mealCost = (totalAdults * foodPriceAdult) + (totalChildren * foodPriceChildren);
    const roomTotalPrice = summary.reduce((acc, item) => acc + item.subtotal, 0);
    const grandTotal = roomTotalPrice + mealCost;

    return {
        summary,     // Array per room
        grandTotal,  // Number
        totalGuests, // Number
        numNights,   // Number
        totalAdults,
        totalChildren,
        mealCost,
        roomTotalPrice
    };
}
