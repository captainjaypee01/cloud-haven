import { differenceInDays, parseISO } from "date-fns";

/**
 * Centralized calculation for cart summary and totals.
 */
export function calculateCartSummary({ items = [], checkIn, checkOut, extraGuestFee = 1000 }) {
    const numNights =
        checkIn && checkOut
            ? Math.max(differenceInDays(parseISO(checkOut), parseISO(checkIn)), 1)
            : 1;

    const summary = items.map(item => {
        const totalGuests = item.adults + item.children;
        const extraGuests = Math.max(totalGuests - item.maxGuests, 0);
        const thisExtraFee = extraGuests * (item?.extraGuestFee ?? extraGuestFee) * numNights;
        const subtotal = (item.price * numNights) + thisExtraFee;
        return {
            ...item,
            subtotal,
            extraGuests,
            extraGuestFee: thisExtraFee,
            totalGuests,
            numNights,
        };
    });

    const grandTotal = summary.reduce((acc, item) => acc + item.subtotal, 0);
    const totalGuests = summary.reduce((acc, item) => acc + item.totalGuests, 0);

    return {
        summary,     // Array per room
        grandTotal,  // Number
        totalGuests, // Number
        numNights,   // Number
    };
}
