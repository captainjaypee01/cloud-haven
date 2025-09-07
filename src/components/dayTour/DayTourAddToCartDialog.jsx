import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { UtensilsCrossed, Coffee } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestSelector } from "../GuestSelector";
import { toast } from "sonner";

export function DayTourAddToCartDialog({ 
    open, 
    onOpenChange, 
    room, 
    currentPricing, 
    availability, 
    selectedDate,
    onConfirm 
}) {
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [includeLunch, setIncludeLunch] = useState(false);
    const [includePmSnack, setIncludePmSnack] = useState(false);

    // Get guest limits for Day Tour rooms
    const getGuestLimits = () => {
        const minGuests = room?.min_guests || 1;
        const maxGuests = room?.max_guests_range || room?.max_guests || (room?.max_guests + room?.extra_guests) || 10;
        
        return { minGuests, maxGuests };
    };

    // Reset form when dialog opens/closes or room changes
    useEffect(() => {
        if (open && room) {
            // Reset to normal defaults
            setAdults(2);
            setChildren(0);
            setIncludeLunch(false);
            setIncludePmSnack(false);
        }
    }, [open, room]);

    const handleConfirm = () => {
        const totalGuests = adults + children;
        const minGuests = room.min_guests || 1;
        const maxGuests = room.max_guests_range || room.max_guests;
        
        // Validate guest count against room capacity range
        if (totalGuests < minGuests) {
            toast.error(`Minimum ${minGuests} guests required for this facility.`);
            return;
        }
        
        if (totalGuests > maxGuests) {
            toast.error(`Maximum ${maxGuests} guests allowed for this facility.`);
            return;
        }
        
        // Call the parent's onConfirm with all the data
        onConfirm(room, adults, children, includeLunch, includePmSnack);
        
        // Close dialog
        onOpenChange(false);
    };

    if (!room) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add {room.name} to Cart</DialogTitle>
                    <DialogDescription>
                        Select your guest count and meal options for your Day Tour.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Guest Selection */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Guest Count</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Adults</label>
                                <GuestSelector
                                    name="adults"
                                    minGuests={1}
                                    maxGuests={getGuestLimits().maxGuests}
                                    value={adults.toString()}
                                    onChange={(value) => setAdults(parseInt(value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Children</label>
                                <GuestSelector
                                    name="children"
                                    minGuests={0}
                                    maxGuests={getGuestLimits().maxGuests}
                                    value={children.toString()}
                                    onChange={(value) => setChildren(parseInt(value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Meal Options */}
                    {availability && (availability.buffet_active || (availability.pm_snack_prices && availability.pm_snack_policy !== 'hidden')) && (
                        <div className="space-y-4">
                            <h4 className="font-medium">Meal Options</h4>
                            
                            {/* Buffet Lunch */}
                            {availability.buffet_active && availability.lunch_prices && (
                                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                                    <Checkbox
                                        id="lunch"
                                        checked={includeLunch}
                                        onCheckedChange={setIncludeLunch}
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="lunch"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Buffet Lunch
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Delicious buffet lunch with local and international cuisine
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline">
                                                Adult: {formatCurrency(availability.lunch_prices.adult)}
                                            </Badge>
                                            <Badge variant="outline">
                                                Child: {formatCurrency(availability.lunch_prices.child)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <UtensilsCrossed className="w-5 h-5 text-gray-400 mt-1" />
                                </div>
                            )}

                            {/* PM Snack */}
                            {availability.pm_snack_prices && availability.pm_snack_policy !== 'hidden' && (
                                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                                    <Checkbox
                                        id="pmSnack"
                                        checked={includePmSnack || availability.pm_snack_policy === 'required'}
                                        onCheckedChange={availability.pm_snack_policy === 'required' ? undefined : setIncludePmSnack}
                                        disabled={availability.pm_snack_policy === 'required'}
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor="pmSnack"
                                            className={`text-sm font-medium leading-none ${
                                                availability.pm_snack_policy === 'required' 
                                                    ? 'cursor-not-allowed opacity-70' 
                                                    : 'cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                            }`}
                                        >
                                            PM Snack
                                            {availability.pm_snack_policy === 'required' && (
                                                <Badge variant="secondary" className="ml-2">Required</Badge>
                                            )}
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {availability.pm_snack_policy === 'required' 
                                                ? 'Afternoon snack included in your Day Tour package'
                                                : 'Light afternoon snacks and refreshments'
                                            }
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline">
                                                Adult: {formatCurrency(availability.pm_snack_prices.adult)}
                                            </Badge>
                                            <Badge variant="outline">
                                                Child: {formatCurrency(availability.pm_snack_prices.child)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Coffee className="w-5 h-5 text-gray-400 mt-1" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Day Tour Price:</span>
                            <span>{formatCurrency(currentPricing?.price_per_pax || 0)} × {adults + children} guest{adults + children > 1 ? 's' : ''}</span>
                        </div>
                        
                        {/* Meal Add-ons */}
                        {(includeLunch || (includePmSnack || availability?.pm_snack_policy === 'required')) && (
                            <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Meal Add-ons</h5>
                                
                                {includeLunch && availability?.lunch_prices && (
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">Buffet Lunch</div>
                                            <div className="text-sm text-gray-600">
                                                {adults} adult{adults > 1 ? 's' : ''} × {formatCurrency(availability.lunch_prices.adult)}
                                                {children > 0 && (
                                                    <> + {children} child{children > 1 ? 'ren' : ''} × {formatCurrency(availability.lunch_prices.child)}</>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-green-600">
                                            {formatCurrency((adults * availability.lunch_prices.adult) + (children * availability.lunch_prices.child))}
                                        </span>
                                    </div>
                                )}
                                
                                {(includePmSnack || availability?.pm_snack_policy === 'required') && availability?.pm_snack_prices && (
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700">
                                                PM Snack
                                                {availability.pm_snack_policy === 'required' && (
                                                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Required</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {adults} adult{adults > 1 ? 's' : ''} × {formatCurrency(availability.pm_snack_prices.adult)}
                                                {children > 0 && (
                                                    <> + {children} child{children > 1 ? 'ren' : ''} × {formatCurrency(availability.pm_snack_prices.child)}</>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-green-600">
                                            {formatCurrency((adults * availability.pm_snack_prices.adult) + (children * availability.pm_snack_prices.child))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex justify-between font-medium pt-2 border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(
                                ((currentPricing?.price_per_pax || 0) * (adults + children)) +
                                (includeLunch && availability?.lunch_prices ? (adults * availability.lunch_prices.adult) + (children * availability.lunch_prices.child) : 0) +
                                ((includePmSnack || availability?.pm_snack_policy === 'required') && availability?.pm_snack_prices ? (adults * availability.pm_snack_prices.adult) + (children * availability.pm_snack_prices.child) : 0)
                            )}</span>
                        </div>
                    </div>

                    {/* Guest Count Validation */}
                    {(() => {
                        const totalGuests = adults + children;
                        const { minGuests, maxGuests } = getGuestLimits();
                        
                        if (totalGuests < minGuests) {
                            return (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-sm text-orange-800">
                                        <strong>Minimum {minGuests} guests required</strong> for this facility. 
                                        You currently have {totalGuests} guest{totalGuests !== 1 ? 's' : ''} selected.
                                    </p>
                                </div>
                            );
                        }
                        
                        if (totalGuests > maxGuests) {
                            return (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">
                                        <strong>Maximum {maxGuests} guests allowed</strong> for this facility. 
                                        You currently have {totalGuests} guest{totalGuests !== 1 ? 's' : ''} selected.
                                    </p>
                                </div>
                            );
                        }
                        
                        return null;
                    })()}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={(() => {
                                const totalGuests = adults + children;
                                const { minGuests, maxGuests } = getGuestLimits();
                                return totalGuests < minGuests || totalGuests > maxGuests;
                            })()}
                            className="flex-1 cursor-pointer"
                        >
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
