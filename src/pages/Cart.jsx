import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { GuestSelector } from "../components/GuestSelector";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Separator } from "@radix-ui/react-select";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { Trash } from "lucide-react";

const Cart = () => {
    const { state: { items }, updateItem, removeItem, clear } = useCart();
    const { control, reset, clearErrors } = useForm();

    // Keep form in sync with cart items
    useEffect(() => {
        const values = {};
        items.forEach(item => {
            values[`adults-${item.uniqueId}`] = String(item.adults);
            values[`children-${item.uniqueId}`] = String(item.children);
        });
        reset(values);
    }, [items, reset]);

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

    // Compute totals
    const summary = items.map(item => {
        const extraGuests = Math.max((item.adults + item.children) - item.maxGuests, 0);
        const extraGuestFee = extraGuests * 1000;
        const subtotal = item.price + extraGuestFee;
        return {
            ...item,
            subtotal,
            extraGuests,
            extraGuestFee,
            totalGuests: item.adults + item.children,
        };
    });

    const grandTotal = summary.reduce((total, item) => total + item.subtotal, 0);
    const totalGuests = summary.reduce((acc, item) => acc + item.totalGuests, 0);
    return (
        <div className="min-h-screen py-16 px-2 md:px-8 lg:px-32 bg-gray-50 mt-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white rounded-2xl shadow-lg p-6 md:p-10">
                {/* Left: Detailed Items */}
                <div className="lg:col-span-2">
                    <h1 className="text-2xl md:text-3xl font-bold mb-8">Your Booking Cart</h1>
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <p className="mb-6">Your cart is empty. Add some rooms!</p>
                            <Button asChild variant="outline" size="lg">
                                <a href="/rooms">Go to Accommodations</a>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 mb-8">
                            {summary.map(item => (
                                <div
                                    key={item.uniqueId}
                                    className="border rounded-xl p-4 md:p-6 flex flex-col gap-4 shadow-sm bg-gray-50"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg">{item.name}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{formatCurrency(item.price)} / night</p>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeItem(item.uniqueId)}
                                            className="text-red-600 hover:text-red-800 cursor-pointer"
                                        >
                                            <Trash size={18} />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label htmlFor={`adults-${item.uniqueId}`} className="block text-sm font-medium mb-1">Adults</label>
                                            <Controller
                                                name={`adults-${item.uniqueId}`}
                                                control={control}
                                                render={({ field }) => (
                                                    <GuestSelector
                                                        name={field.name}
                                                        maxGuests={item.maxGuests}
                                                        value={field.value}
                                                        onChange={v => handleChange(item, "adults", v)}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`children-${item.uniqueId}`} className="block text-sm font-medium mb-1">Children</label>
                                            <Controller
                                                name={`children-${item.uniqueId}`}
                                                control={control}
                                                render={({ field }) => (
                                                    <GuestSelector
                                                        name={field.name}
                                                        maxGuests={item.maxGuests}
                                                        value={field.value}
                                                        onChange={v => handleChange(item, "children", v)}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm mt-4">
                                        <span>Room Price:</span>
                                        <span>{formatCurrency(item.price)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Extra Guest:</span>
                                        <span>{item.extraGuests} x {formatCurrency(item.extraGuestFee)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(item.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Total Guests:</span>
                                        <span>{item.totalGuests}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Right: Summary */}
                <div className="sticky top-28 h-fit bg-gray-100/60 rounded-xl shadow-inner p-6 flex flex-col gap-6 min-w-[270px]">
                    <h2 className="text-xl font-bold mb-2">Summary</h2>
                    <div className="space-y-2">
                        {summary.map(item => (
                            <div key={item.uniqueId} className="mb-3 border-b pb-3 last:border-none last:pb-0">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{item.name}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>{item.totalGuests} guests</span>
                                    <span>{item.adults}A {item.children > 0 && `/ ${item.children}C`}</span>
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
                    <Button variant="destructive" className="mt-3" onClick={clear}>Clear Cart</Button>
                    <Button variant="primary" size="lg" className="mt-1">Proceed to Checkout</Button>
                </div>
            </div>
        </div>
    );
}

export default Cart;