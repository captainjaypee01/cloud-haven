import { useEffect, useState } from "react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"; // proper imports
import { Button } from "@/components/ui/button";
import { useCart } from "../context/CartContext";
import { Trash } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { GuestSelector } from "./GuestSelector";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { Separator } from "@radix-ui/react-select";

export function CartPopup() {
    const [open, setOpen] = useState(false);
    const {
        state: { items },
        updateItem,
        removeItem,
    } = useCart();
    const { control, clearErrors, reset } = useForm();

    // 🔥 Ensure Controller value matches cart item state on update
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
            toast.error(
                `Max ${item.maxGuests} guests allowed (you have ${total}).`
            );
            return;
        }

        clearErrors(`${item.uniqueId}`);
        updateItem(item.uniqueId, { adults, children, guests: total });
    };

    const grandTotal = items.reduce(
        (acc, it) => acc + it.price,
        0
    );
    console.log(items);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="cursor-pointer">🛒 Cart ({items.length})</Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 space-y-4">
                <h3 className="text-lg font-semibold">Your Cart</h3>
                {items.length === 0 ? (
                    <p className="text-sm text-gray-500">No rooms added.</p>
                ) : (
                    <>
                        {items.map((item) => (
                            <div
                                key={item.uniqueId}
                                className="flex flex-col space-y-2 border-b pb-4 last:pb-0 last:border-none"
                            >
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{item.name}</p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeItem(item.uniqueId)}
                                        className="text-red-600 hover:underline cursor-pointer"
                                    >
                                        <Trash size={16} />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-start">
                                    <div className="space-y-1">
                                        <label htmlFor={`adults-${item.uniqueId}`} className="text-sm font-medium">
                                            Adults
                                        </label>
                                        <Controller
                                            name={`adults-${item.uniqueId}`}
                                            control={control}
                                            defaultValue={String(item.adults)}
                                            render={({ field }) => (
                                                <GuestSelector
                                                    name={field.name}
                                                    maxGuests={item.maxGuests}
                                                    value={field.value}
                                                    onChange={v => handleChange(item, "adults", v)}
                                                    isPopover={true}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor={`children-${item.uniqueId}`} className="text-sm font-medium">
                                            Children
                                        </label>
                                        <Controller
                                            name={`children-${item.uniqueId}`}
                                            control={control}
                                            defaultValue={String(item.children)}
                                            render={({ field }) => (
                                                <GuestSelector
                                                    name={field.name}
                                                    maxGuests={item.maxGuests}
                                                    value={field.value}
                                                    onChange={v => handleChange(item, "children", v)}
                                                    isPopover={true}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                {/* Subtotal */}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Price:</span>
                                    <span>{formatCurrency(item.price)}</span>
                                </div>
                                {/* <div className="flex justify-between font-medium">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(item.price)}</span>
                                </div> */}
                            </div>
                        ))}

                        <Separator />

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-lg font-semibold">Total:</span>
                            <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
                        </div>
                    </>
                )}
                {items.length > 0 && (
                    <Button asChild variant="primary" className="w-full">
                        <a href="/cart">View Cart</a>
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}