import React, { useState, useEffect } from 'react';
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
import { useRoomAvailability } from '../../hooks/useRoomAvailability';
import { Checkbox } from "@/components/ui/checkbox";
import { useApi } from "@/hooks/useApi";
import { fetchDayTourAvailability } from "@/services/dayTour";
import { format } from "date-fns";
import { validateRoomTypeMixing, isDayTourRoom } from "@/utils/roomTypeUtils";
import DeleteDialog from "@/components/common/form/DeleteDialog";

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
    availableUnits: propAvailableUnits,
    isUnavailable: propIsUnavailable,
    availabilityLoading: propAvailabilityLoading = false,
}) => {
    const {
        state,
        addItem,
        clear,
        clearItemsOnly,
        currentPricing,
        mealProgram,
        pricingLoading,
        mealLoading,
        fetchDayTourData
    } = useCart();
    const api = useApi();
    const [includeLunch, setIncludeLunch] = useState(false);
    const [includePmSnack, setIncludePmSnack] = useState(false);
    const [showMixingDialog, setShowMixingDialog] = useState(false);

    // Use room availability hook if room and dates are available
    const {
        availableUnits: hookAvailableUnits,
        isUnavailable: hookIsUnavailable,
        isLoading: hookAvailabilityLoading,
    } = useRoomAvailability(
        room?.slug,
        state?.checkIn,
        state?.checkOut,
        { enabled: !!room?.slug && !!state?.checkIn && !!state?.checkOut }
    );

    // Use props if provided, otherwise use hook values
    const availableUnits = propAvailableUnits !== undefined ? propAvailableUnits : hookAvailableUnits;
    const isUnavailable = propIsUnavailable !== undefined ? propIsUnavailable : hookIsUnavailable;
    const availabilityLoading = propAvailabilityLoading || hookAvailabilityLoading;
    const { control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            adults: "2",
            children: "0"
        },
    });

    // Determine if this is a Day Tour context
    const isDayTourContext = () => {
        // Check if current room explicitly has day_tour type
        if (room?.roomType === 'day_tour') return true;
        
        // Check if we have a Day Tour date set AND current room is for Day Tour
        if (state?.dayTourDate && room?.roomType === 'day_tour') return true;
        
        return false;
    };

    // Get guest limits for Day Tour rooms
    const getGuestLimits = () => {
        if (isDayTourContext()) {
            // For Day Tour, try to get min/max from room data with multiple fallbacks
            const minGuests = room?.min_guests || 1; // Default to 1 if not specified
            
            // Priority order for max guests:
            // 1. max_guests_range (Day Tour specific range)
            // 2. max_guests + extra_guests (traditional room logic) 
            // 3. max_guests alone
            // 4. Default to 10 if nothing is available
            const maxGuests = room?.max_guests_range || 
                             (room?.max_guests && room?.extra_guests ? room.max_guests + room.extra_guests : null) ||
                             room?.max_guests || 
                             10;
            
            return { minGuests, maxGuests };
        } else {
            // For overnight rooms, use traditional logic
            const maxGuests = (room?.max_guests || 0) + (room?.extra_guests || 0);
            return { 
                minGuests: 0, 
                maxGuests: maxGuests || 10 // Fallback to 10 if no limits specified
            };
        }
    };

    // Ensure Day Tour data is available when dialog opens for Day Tour context
    useEffect(() => {
        if (open && isDayTourContext()) {
            
            // If we don't have the data and there's a Day Tour date, fetch it
            if (!currentPricing && !mealProgram && state?.dayTourDate) {
                fetchDayTourData(state.dayTourDate);
            } else if (!currentPricing && !mealProgram && state?.items?.length > 0) {
                // Try to get date from existing Day Tour items
                const dayTourItem = state.items.find(item => item.dayTourDate || item.roomType === 'day_tour');
                if (dayTourItem) {
                    const dateToUse = dayTourItem.dayTourDate || state.dayTourDate;
                    fetchDayTourData(dateToUse);
                }
            }
        }
    }, [open, room?.roomType, currentPricing, mealProgram, state?.dayTourDate, state?.items]);

    // Reset meal options when dialog closes
    useEffect(() => {
        if (!open) {
            setIncludeLunch(false);
            setIncludePmSnack(false);
        }
    }, [open]);


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

        // For Day Tour rooms, check if date is selected
        if (room.roomType === 'day_tour') {
            if (!room.dayTourDate) {
                toast.error('Please select a Day Tour date first.');
                onOpenChange(false);
                return;
            }
        } else {
            // For overnight rooms, check check-in/check-out dates
            if (!state?.checkIn || !state?.checkOut) {
                toast.error('Please select dates first.');
                onOpenChange(false);
                return;
            }
            
            // Validate that check-in date is before check-out date
            const checkInDate = new Date(state.checkIn);
            const checkOutDate = new Date(state.checkOut);
            if (checkInDate >= checkOutDate) {
                toast.error('Check-in date must be before check-out date.');
                onOpenChange(false);
                return;
            }
        }

        if (isUnavailable) {
            toast.error('This room is not available for your selected dates.');
            onOpenChange(false);
            return;
        }

        // Check for room type mixing
        const mixingValidation = validateRoomTypeMixing(state.items, room);
        if (!mixingValidation.isValid) {
            setShowMixingDialog(true);
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

        // Calculate prices for Day Tour rooms
        let roomData = {
            roomId: room.slug,
            name: room.name,
            adults: parseInt(adults),
            children: parseInt(children),
            maxGuests: room.max_guests,
            extraGuests: room.extra_guests,
            roomType: room.roomType,
        };

        if (isDayTourContext()) {
            // Calculate Day Tour pricing using data from Cart Context
            const pricePerPax = currentPricing?.price_per_pax || room.price || 0;
            const basePrice = pricePerPax * totalGuests;
            let lunchCost = 0;
            let pmSnackCost = 0;

            if (includeLunch && mealProgram?.lunch_prices) {
                lunchCost = (parseInt(adults) * mealProgram.lunch_prices.adult) +
                    (parseInt(children) * mealProgram.lunch_prices.child);
            }

            if (includePmSnack && mealProgram?.pm_snack_prices) {
                pmSnackCost = (parseInt(adults) * mealProgram.pm_snack_prices.adult) +
                    (parseInt(children) * mealProgram.pm_snack_prices.child);
            }

            const mealCost = lunchCost + pmSnackCost;
            const totalPrice = basePrice + mealCost;

            // Calculate Day Tour pricing
            roomData = {
                ...roomData,
                roomType: 'day_tour', // Explicitly set Day Tour room type
                pricePerPax: pricePerPax,
                basePrice: basePrice,
                price: totalPrice,
                includeLunch: includeLunch,
                includePmSnack: includePmSnack,
                lunchCost: lunchCost,
                pmSnackCost: pmSnackCost,
                mealCost: mealCost,
                dayTourDate: state?.dayTourDate || (state?.items?.find(item => item.dayTourDate)?.dayTourDate),
                // Include guest limits for consistency
                minGuests: room?.min_guests || 1,
                maxGuestsRange: room?.max_guests_range || room?.max_guests || (room?.max_guests + room?.extra_guests),
                totalGuests: totalGuests,
            };
        } else {
            // For overnight rooms, use the original price
            roomData.price = room.price;
        }

        // Add room to cart
        addItem(roomData);

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
                            <span className="text-gray-600">
                                {room.roomType === 'day_tour' ? ' / person' : ' / night'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Maximum guests: <span className="font-medium">{room.max_guests}</span>
                            {room.extra_guests > 0 && (
                                <span> (+ {room.extra_guests} extra)</span>
                            )}
                        </div>
                        {room.roomType === 'day_tour' && room.dayTourDate && (
                            <div className="text-sm text-gray-600">
                                Day Tour Date: {new Date(room.dayTourDate).toLocaleDateString()}
                            </div>
                        )}
                        {room.roomType !== 'day_tour' && state?.checkIn && state?.checkOut && (
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
                                            minGuests={1}
                                            maxGuests={getGuestLimits().maxGuests}
                                            isDialog={true}
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Children (4-6 years old)</label>
                            <Controller
                                name="children"
                                control={control}
                                render={({ field }) => (
                                    <div className="w-full">
                                        <GuestSelector
                                            minGuests={0}
                                            maxGuests={getGuestLimits().maxGuests}
                                            isDialog={true}
                                            showChildPolicy={true}
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            <span>3 years old and below are free of charge.</span>
                        </div>
                    </div>

                    {/* Meal Options for Day Tour */}
                    {isDayTourContext() && mealProgram && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">Meal Add-ons</h4>

                            {/* Buffet Lunch Option */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="quick-lunch"
                                        checked={includeLunch}
                                        onCheckedChange={setIncludeLunch}
                                        disabled={!mealProgram.buffet_active}
                                        className="cursor-pointer"
                                    />
                                    <div>
                                        <label htmlFor="quick-lunch" className="text-sm font-medium text-gray-700 cursor-pointer">
                                            Buffet Lunch
                                            {!mealProgram.buffet_active && (
                                                <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                            )}
                                        </label>
                                        {includeLunch && mealProgram.lunch_prices && (
                                            <div className="text-xs text-gray-600">
                                                {watchedAdults} adult{watchedAdults > 1 ? 's' : ''} × {formatCurrency(mealProgram.lunch_prices.adult)}
                                                {parseInt(watchedChildren) > 0 && (
                                                    <> + {watchedChildren} child{parseInt(watchedChildren) > 1 ? 'ren' : ''} × {formatCurrency(mealProgram.lunch_prices.child)}</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                    {includeLunch && mealProgram.lunch_prices ?
                                        formatCurrency((parseInt(watchedAdults) * mealProgram.lunch_prices.adult) + (parseInt(watchedChildren) * mealProgram.lunch_prices.child)) :
                                        "—"}
                                </span>
                            </div>

                            {/* PM Snack Option */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="quick-pmSnack"
                                        checked={includePmSnack}
                                        onCheckedChange={setIncludePmSnack}
                                        disabled={mealProgram.pm_snack_policy === 'hidden'}
                                        className="cursor-pointer"
                                    />
                                    <div>
                                        <label htmlFor="quick-pmSnack" className="text-sm font-medium text-gray-700 cursor-pointer">
                                            PM Snack
                                            {mealProgram.pm_snack_policy === 'optional' && (
                                                <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                                            )}
                                            {mealProgram.pm_snack_policy === 'hidden' && (
                                                <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                            )}
                                            {mealProgram.pm_snack_policy === 'required' && (
                                                <span className="ml-2 text-xs text-orange-600">(Required)</span>
                                            )}
                                        </label>
                                        {includePmSnack && mealProgram.pm_snack_prices && (
                                            <div className="text-xs text-gray-600">
                                                {watchedAdults} adult{watchedAdults > 1 ? 's' : ''} × {formatCurrency(mealProgram.pm_snack_prices.adult)}
                                                {parseInt(watchedChildren) > 0 && (
                                                    <> + {watchedChildren} child{parseInt(watchedChildren) > 1 ? 'ren' : ''} × {formatCurrency(mealProgram.pm_snack_prices.child)}</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                    {includePmSnack && mealProgram.pm_snack_prices ?
                                        formatCurrency((parseInt(watchedAdults) * mealProgram.pm_snack_prices.adult) + (parseInt(watchedChildren) * mealProgram.pm_snack_prices.child)) :
                                        "—"}
                                </span>
                            </div>
                        </div>
                    )}

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
                            <div className="space-y-1">
                                <p className="text-sm text-orange-600">
                                    Maximum of extra {room.extra_guests} guests allowed
                                </p>
                                {!isDayTourContext() && (
                                    <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                                        ⚠️ Extra guests may incur additional breakfast fees on free breakfast days
                                    </p>
                                )}
                            </div>
                        )}

                        {totalGuests === 0 && (
                            <p className="text-sm text-red-600">
                                Please select at least 1 guest
                            </p>
                        )}

                        {/* Day Tour Guest Count Validation */}
                        {isDayTourContext() && (() => {
                            const { minGuests, maxGuests } = getGuestLimits();
                            
                            if (totalGuests > 0 && totalGuests < minGuests) {
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
                                availabilityLoading ||
                                (isDayTourContext() && (() => {
                                    const { minGuests, maxGuests } = getGuestLimits();
                                    return totalGuests < minGuests || totalGuests > maxGuests;
                                })())
                            }
                            className="cursor-pointer flex-1 sm:flex-none"
                        >
                            {isUnavailable ? 'Sold Out' : 'Add to Cart'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            
            {/* Room Type Mixing Prevention Dialog */}
            <DeleteDialog
                open={showMixingDialog}
                onOpenChange={setShowMixingDialog}
                title={isDayTourRoom(room) ? "Clear Overnight Booking?" : "Clear Day Tour Booking?"}
                description={
                    isDayTourRoom(room) 
                        ? "You have overnight rooms in your cart. Day Tour and overnight bookings cannot be mixed. Would you like to clear your cart and continue with Day Tour?"
                        : "You have Day Tour rooms in your cart. Day Tour and overnight bookings cannot be mixed. Would you like to clear your cart and continue with overnight booking?"
                }
                onConfirm={() => {
                    // Clear only the items but preserve dates
                    clearItemsOnly();
                    setShowMixingDialog(false);
                    toast.success("Cart cleared. You can now add this room type.");
                }}
                confirmText="Clear Cart"
                cancelText="Cancel"
            />
        </Dialog>
    );
};
