import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GuestSelector } from '../GuestSelector';
import { formatCurrency } from '../../utils/currency';
import { toast } from "sonner";
import { useCart } from '@/context/CartContext';

/**
 * Quick Booking Dialog Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Function to handle dialog open/close
 * @param {Object} props.room - Room object with details
 * @param {number} props.availableUnits - Number of available units
 * @param {boolean} props.isUnavailable - Whether the room is unavailable
 * @param {boolean} props.availabilityLoading - Whether availability is loading
 * 
 * @returns {JSX.Element} The quick booking dialog component
 */
export const QuickBookingDialog = ({
    open,
    onOpenChange,
    room,
    availableUnits,
    isUnavailable,
    availabilityLoading = false,
}) => {
    const { state, addItem } = useCart();
    const { control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            adults: "2",
            children: "0"
        },
    });

    // Watch form values for real-time validation
    const watchedAdults = watch("adults");
    const watchedChildren = watch("children");
    const totalGuests = parseInt(watchedAdults || "0") + parseInt(watchedChildren || "0");

    // Check if guest count exceeds room capacity
    const exceedsCapacity = room && totalGuests > (parseInt(room.max_guests) + parseInt(room.extra_guests));
    const exceedsMaxGuests = room && totalGuests > parseInt(room.max_guests);

    const handleBooking = (data) => {
        const { adults, children } = data;
        const totalGuests = parseInt(adults) + parseInt(children);

        // Validation checks
        if (totalGuests === 0) {
            toast.error('Please select at least 1 guest.');
            return;
        }

        if (totalGuests > parseInt(room.max_guests) + parseInt(room.extra_guests)) {
            toast.error(`Only up to ${room.max_guests + room.extra_guests} guests can stay in this room.`);
            return;
        }

        if (!state?.checkIn || !state?.checkOut) {
            toast.error('Please select dates first.');
            onOpenChange(false);
            return;
        }

        if (isUnavailable) {
            toast.error('This room is not available for your selected dates.');
            onOpenChange(false);
            return;
        }

        // Check availability limits
        const roomsInCart = state.items.filter(item => item.roomId === room.slug).length;
        
        if (availableUnits !== undefined && roomsInCart >= availableUnits) {
            const remainingUnits = Math.max(0, availableUnits - roomsInCart);
            if (remainingUnits === 0) {
                toast.error(`No more ${room.name} rooms available for your selected dates.`);
            } else {
                toast.error(`Only ${remainingUnits} more ${room.name} room${remainingUnits === 1 ? '' : 's'} available for your selected dates.`);
            }
            return;
        }

        // Add room to cart
        addItem({
            roomId: room.slug,
            name: room.name,
            price: room.price,
            adults: parseInt(adults),
            children: parseInt(children),
            maxGuests: room.max_guests,
            extraGuests: room.extra_guests,
        });

        // Show warning for extra guests
        if (exceedsMaxGuests) {
            toast.warning(
                `Max ${room.max_guests} guests allowed (you have ${totalGuests}). We allow for ${room.extra_guests} extra guest/s.`
            );
        }

        // Close dialog and reset form
        onOpenChange(false);
        reset();
    };

    // Reset form when dialog closes
    const handleOpenChange = (newOpen) => {
        if (!newOpen) {
            reset();
        }
        onOpenChange(newOpen);
    };

    if (!room) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Book {room.name}
                    </DialogTitle>
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <div>
                            <span className="font-medium text-lg text-sky-700">
                                {formatCurrency(room.price)}
                            </span>
                            <span className="text-gray-600"> / night</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Maximum guests: <span className="font-medium">{room.max_guests}</span>
                            {room.extra_guests > 0 && (
                                <span> (+ {room.extra_guests} extra)</span>
                            )}
                        </div>
                        {state?.checkIn && state?.checkOut && (
                            <div className="text-sm text-gray-600">
                                {new Date(state.checkIn).toLocaleDateString()} - {new Date(state.checkOut).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleBooking)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Adults</label>
                            <Controller
                                name="adults"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full">
                                        <GuestSelector
                                            maxGuests={room.max_guests + room.extra_guests}
                                            isDialog={true}
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Children</label>
                            <Controller
                                name="children"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full">
                                        <GuestSelector
                                            maxGuests={room.max_guests + room.extra_guests}
                                            isDialog={true}
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Guest count feedback */}
                    <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                            Total guests: <span className={`font-medium ${exceedsCapacity ? 'text-red-600' : 'text-gray-900'}`}>
                                {totalGuests}
                            </span>
                        </div>
                        
                        {exceedsCapacity && (
                            <p className="text-sm text-red-600">
                                Exceeds maximum capacity of {room.max_guests + room.extra_guests} guests
                            </p>
                        )}
                        
                        {exceedsMaxGuests && !exceedsCapacity && (
                            <p className="text-sm text-orange-600">
                                Extra guest fee may apply (over {room.max_guests} guests)
                            </p>
                        )}

                        {totalGuests === 0 && (
                            <p className="text-sm text-red-600">
                                Please select at least 1 guest
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => handleOpenChange(false)}
                            className="cursor-pointer flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            disabled={
                                exceedsCapacity || 
                                totalGuests === 0 || 
                                isUnavailable || 
                                availabilityLoading
                            }
                            className="cursor-pointer flex-1 sm:flex-none"
                        >
                            {isUnavailable ? 'Sold Out' : 'Add to Cart'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
