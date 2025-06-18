import React from 'react'
import { formatCurrency } from '../utils/currency';
import { Controller } from 'react-hook-form';
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestSelector } from "../components/GuestSelector";

const CartList = ({
    summary = [],
    removeItem = () => { },
    handleChange = () => { },
    handleView = () => { },
    control,
    numNights = 1, // pass from parent
}) => {

    return summary.map(item => (
        <div
            key={item.uniqueId}
            className="border rounded-xl p-4 md:p-6 flex flex-col gap-4 shadow-sm bg-gray-50"
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                        {formatCurrency(item.price)} / night • {numNights} night{numNights > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500">Max {item.maxGuests} guests</p>
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

            {/* View Room Button */}
            <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => handleView(item.roomId)} className="cursor-pointer">
                    View Room
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
                                maxGuests={item.maxGuests + item.extraGuests}
                                value={field.value ?? ""}
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
                                maxGuests={item.maxGuests + item.extraGuests}
                                value={field.value ?? ""}
                                onChange={v => handleChange(item, "children", v)}
                            />
                        )}
                    />
                </div>
            </div>
            <div className="flex justify-between text-sm mt-4">
                <span>Room Price:</span>
                <span>{formatCurrency(item.price)} x {numNights} night{numNights > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span>Extra Guest:</span>
                <span>
                    {item.extraGuests} x {formatCurrency(item.extraGuestFee / (numNights || 1))} x {numNights} night{numNights > 1 ? "s" : ""}
                </span>
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
    ));
}

export default CartList