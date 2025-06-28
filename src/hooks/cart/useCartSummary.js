import { useAppContext } from "../../context/AppContext";
import { useCart } from "../../context/CartContext";
import { calculateCartSummary } from "../../utils/cartCalculations";

export function useCartSummary() {
    const { state: { items, checkIn, checkOut } } = useCart();
    const { mealPrices } = useAppContext();
    // Customize extraGuestFee if needed
    return { checkIn, checkOut, ...calculateCartSummary({ items, checkIn, checkOut, mealPrices }) };
}
