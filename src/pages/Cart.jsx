import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { GuestSelector } from "../components/GuestSelector";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Separator } from "@radix-ui/react-select";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { Trash } from "lucide-react";
import CartList from "../components/CartList";
import { RoomDetailModal } from "../components/RoomDetailModal";
import { useAppContext } from "../context/AppContext";
import { differenceInDays, parseISO } from "date-fns";
import { useCartSummary } from "../hooks/cart/useCartSummary";
import { useSyncCartForm } from "../hooks/cart/useSyncCartForm";

const Cart = () => {
    const { state: { items, checkIn, checkOut }, updateItem, removeItem, clear } = useCart();
    const { control, reset, clearErrors } = useForm();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const { navigate } = useAppContext();
    const { summary, grandTotal, totalGuests, numNights } = useCartSummary();

    // Keep form in sync with cart summary
    useSyncCartForm(items, reset);

    const handleChange = (item, type, val) => {
        const newCount = Number(val);
        const adults = type === "adults" ? newCount : item.adults;
        const children = type === "children" ? newCount : item.children;
        const total = adults + children;

        if (total < 1) {
            toast.error("At least one guest required.");
            return;
        }
        if (total > item.maxGuests) {
            toast.warning(
                `Max ${item.maxGuests} guests allowed (you have ${total}). An extra fee will be applied for each extra guest`
            );
        }

        clearErrors(item.uniqueId);
        updateItem(item.uniqueId, { adults, children, guests: total });
    };

    const handleView = (id) => {
        setSelectedRoomId(id);
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen py-16 px-2 md:px-8 lg:px-32 bg-gray-50 mt-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white rounded-2xl shadow-lg p-6 md:p-10">
                {/* Left: Detailed summary */}
                <div className="lg:col-span-2">
                    <h1 className="text-2xl md:text-3xl font-bold mb-8">Your Booking Cart</h1>
                    {summary.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <p className="mb-6">Your cart is empty. Add some rooms!</p>
                            <Button asChild variant="outline" size="lg">
                                <a href="/rooms">Go to Accommodations</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 mb-8">
                            <CartList
                                summary={summary}
                                removeItem={removeItem}
                                handleChange={handleChange}
                                handleView={handleView}
                                numNights={numNights}
                                control={control}
                            />
                            <RoomDetailModal
                                open={modalOpen}
                                roomId={selectedRoomId}
                                onOpenChange={(open) => {
                                    setModalOpen(open);
                                    if (!open) setSelectedRoomId(null);
                                }}
                            />
                        </div>
                    )}
                </div>
                {/* Right: Summary */}
                <div className="sticky top-28 h-fit bg-gray-100/60 rounded-xl shadow-inner p-6 flex flex-col gap-6 min-w-[270px]">
                    <h2 className="text-xl font-bold mb-2">Summary</h2>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Check-in date</span>
                            <span>{checkIn || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Check-out date</span>
                            <span>{checkOut || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Number of nights</span>
                            <span>{numNights}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {summary.map(item => (
                            <div key={item.uniqueId} className="mb-3 border-b pb-3 last:border-none last:pb-0">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{item.name}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>{item.totalGuests} guests, {numNights} night{numNights > 1 ? "s" : ""}</span>
                                    <span>{item.adults}A{item.children > 0 && ` / ${item.children}C`}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total Guests</span>
                        <span>{totalGuests}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <Button variant="destructive" className="mt-3 cursor-pointer" onClick={clear}>Clear Cart</Button>
                    {summary.length > 0 && (
                        <Button variant="outline" size="lg" className="mt-1 cursor-pointer" onClick={() => { scrollTo(0, 0); navigate('/checkout') }}>Proceed to Checkout</Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Cart;