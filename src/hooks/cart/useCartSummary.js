import { useCart } from "../../context/CartContext";
import { calculateCartSummary } from "../../utils/cartCalculations";

export function useCartSummary() {
    const { state: { items, checkIn, checkOut } } = useCart();
    // Customize extraGuestFee if needed
    return { checkIn, checkOut, ...calculateCartSummary({ items, checkIn, checkOut }) };
}
