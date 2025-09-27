import React, { useState } from 'react'
import { formatCurrency } from '../utils/currency';
import { Controller } from 'react-hook-form';
import { Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestSelector } from "../components/GuestSelector";
import { QuickBookingDialog } from "./common/QuickBookingDialog";
import { DayTourAddToCartDialog } from "./dayTour/DayTourAddToCartDialog";
import { useCart } from "../context/CartContext";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBuffetDate, formatMealDate, formatBuffetDateRange } from "../utils/dateUtils";

const CartList = ({
    summary = [],
    removeItem = () => { },
    handleChange = () => { },
    handleView = () => { },
    control,
    numNights = 1, // pass from parent
    isDayTourCart = false, // pass from parent
    dayTourMealData = null, // meal program data for Day Tour
    mealQuote = null, // Add meal quote for checking free breakfast days
}) => {
    const { state, updateItem, addItem, currentPricing, mealProgram } = useCart();
    const { checkIn, checkOut } = state;
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
    const [showDayTourDialog, setShowDayTourDialog] = useState(false);
    const [selectedDayTourRoom, setSelectedDayTourRoom] = useState(null);

    const handleMealOptionChange = (item, option, checked) => {
        const adults = item.adults;
        const children = item.children;
        const total = adults + children;
        
        // Start with existing meal costs to preserve the other option
        let newLunchCost = item.lunchCost || 0;
        let newPmSnackCost = item.pmSnackCost || 0;
        
        // Only update the specific option being changed
        if (option === 'lunch') {
            if (checked && dayTourMealData?.lunch_prices) {
                newLunchCost = (adults * dayTourMealData.lunch_prices.adult) + 
                              (children * dayTourMealData.lunch_prices.child);
            } else {
                newLunchCost = 0;
            }
        } else if (option === 'pmSnack') {
            if (checked && dayTourMealData?.pm_snack_prices) {
                newPmSnackCost = (adults * dayTourMealData.pm_snack_prices.adult) + 
                                (children * dayTourMealData.pm_snack_prices.child);
            } else {
                newPmSnackCost = 0;
            }
        }
        
        const newMealCost = newLunchCost + newPmSnackCost;
        const newBasePrice = item.pricePerPax * total;
        const newTotalPrice = newBasePrice + newMealCost;
        
        const updatedItem = {
            ...(option === 'lunch' ? { includeLunch: checked } : {}),
            ...(option === 'pmSnack' ? { includePmSnack: checked } : {}),
            lunchCost: newLunchCost,
            pmSnackCost: newPmSnackCost,
            mealCost: newMealCost,
            basePrice: newBasePrice,
            price: newTotalPrice
        };
        
        updateItem(item.uniqueId, updatedItem);
    };

    const handleAddAnotherRoom = (item) => {
        if (item.roomType === 'day_tour') {
            // For Day Tour rooms, use DayTourAddToCartDialog
            // Reconstruct room object from cart item data
            const dayTourRoom = {
                slug: item.roomId,
                name: item.name,
                price: item.pricePerPax, // Day Tour uses pricePerPax
                max_guests: parseInt(item.maxGuests),
                extra_guests: parseInt(item.extraGuests),
                min_guests: item.minGuests || 1,
                max_guests_range: item.maxGuestsRange || item.maxGuests,
            };
            setSelectedDayTourRoom(dayTourRoom);
            setShowDayTourDialog(true);
        } else {
            // For overnight rooms, use QuickBookingDialog
            const roomForBooking = {
                slug: item.roomId,
                name: item.name,
                price: item.price,
                max_guests: parseInt(item.maxGuests),
                extra_guests: parseInt(item.extraGuests),
            };
            setSelectedRoomForBooking(roomForBooking);
            setShowBookingDialog(true);
        }
    };

    return (
        <>
            {summary.map(item => (
        <div
            key={item.uniqueId}
            className="border rounded-xl p-4 md:p-6 flex flex-col gap-4 shadow-sm bg-gray-50"
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                        {isDayTourCart 
                            ? `${formatCurrency(item.pricePerPax)} per person • ${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''}`
                            : `${formatCurrency(item.price)} / night • ${numNights} night${numNights > 1 ? "s" : ""}`
                        }
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

            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
                <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => handleAddAnotherRoom(item)} 
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Another Room
                </Button>
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
                                maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
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
                                maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
                                value={field.value ?? ""}
                                onChange={v => handleChange(item, "children", v)}
                            />
                        )}
                    />
                </div>
            </div>
            <div className="flex justify-between text-sm mt-4">
                <span>{isDayTourCart ? 'Day Tour Price:' : 'Room Price:'}</span>
                <span>
                    {isDayTourCart 
                        ? `${formatCurrency(item.pricePerPax)} × ${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''} = ${formatCurrency(item.basePrice || (item.pricePerPax * item.totalGuests))}`
                        : `${formatCurrency(item.price)} x ${numNights} night${numNights > 1 ? "s" : ""} = ${formatCurrency(item.subtotal)}`
                    }
                </span>
            </div>
            
            {/* Extra Guest Warning for Overnight Bookings - Only show on free breakfast days */}
            {!isDayTourCart && item.totalGuests > parseInt(item.maxGuests) && mealQuote?.nights?.some(night => night.type === 'free_breakfast') && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                    ⚠️ You have {item.totalGuests - parseInt(item.maxGuests)} extra guest{item.totalGuests - parseInt(item.maxGuests) > 1 ? 's' : ''} who may incur additional breakfast fees on free breakfast days
                </div>
            )}
            {isDayTourCart && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Meal Add-ons</h5>
                    
                    {/* Buffet Lunch Option */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id={`lunch-${item.uniqueId}`}
                                checked={item.includeLunch || false}
                                onCheckedChange={(checked) => handleMealOptionChange(item, 'lunch', checked)}
                                disabled={!dayTourMealData?.buffet_active}
                                className="cursor-pointer"
                            />
                            <div>
                                <label htmlFor={`lunch-${item.uniqueId}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Buffet Lunch
                                    {!dayTourMealData?.buffet_active && (
                                        <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                    )}
                                </label>
                                {item.includeLunch && dayTourMealData?.lunch_prices && (
                                    <div className="text-xs text-gray-600">
                                        {item.adults} adult{item.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.lunch_prices.adult)}
                                        {item.children > 0 && (
                                            <> + {item.children} child{item.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.lunch_prices.child)}</>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                            {item.includeLunch && item.lunchCost > 0 ? formatCurrency(item.lunchCost) : "—"}
                        </span>
                    </div>
                    
                    {/* PM Snack Option */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id={`pmSnack-${item.uniqueId}`}
                                checked={item.includePmSnack || false}
                                onCheckedChange={(checked) => handleMealOptionChange(item, 'pmSnack', checked)}
                                disabled={dayTourMealData?.pm_snack_policy === 'hidden'}
                                className="cursor-pointer"
                            />
                            <div>
                                <label htmlFor={`pmSnack-${item.uniqueId}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                    PM Snack
                                    {dayTourMealData?.pm_snack_policy === 'hidden' && (
                                        <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                    )}
                                    {dayTourMealData?.pm_snack_policy === 'required' && (
                                        <span className="ml-2 text-xs text-orange-600">(Required)</span>
                                    )}
                                </label>
                                {item.includePmSnack && dayTourMealData?.pm_snack_prices && (
                                    <div className="text-xs text-gray-600">
                                        {item.adults} adult{item.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.adult)}
                                        {item.children > 0 && (
                                            <> + {item.children} child{item.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.child)}</>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                            {item.includePmSnack && item.pmSnackCost > 0 ? formatCurrency(item.pmSnackCost) : "—"}
                        </span>
                    </div>
                    
                    {item.mealCost > 0 && (
                        <div className="flex justify-between font-medium pt-2 border-t border-gray-300">
                            <span>Meal Total:</span>
                            <span className="text-blue-600">{formatCurrency(item.mealCost)}</span>
                        </div>
                    )}
                </div>
            )}
            {/* Per-room meal breakdown */}
            {!isDayTourCart && item.hasRoomMealBreakdown && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h6 className="text-sm font-medium text-blue-700 mb-2">Meal Breakdown for this Room</h6>
                    <div className="space-y-3">
                        {item.mealBreakdown.map((mealNight, index) => (
                            <div key={index} className="border-b border-blue-200 pb-3 last:border-b-0 last:pb-0">
                                {/* Date Header */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-blue-700">
                                        {mealNight.type === 'buffet' 
                                            ? `${formatBuffetDateRange(mealNight.startDate, mealNight.endDate)} - Buffet`
                                            : `${formatMealDate(mealNight.endDate)} - Free Breakfast`
                                        }
                                    </span>
                                    <span className="text-sm font-semibold text-blue-900">
                                        {formatCurrency(mealNight.cost)}
                                    </span>
                                </div>
                                
                                {/* Breakdown Details */}
                                {mealNight.type === 'buffet' ? (
                                    <div className="ml-4 space-y-1 text-xs text-blue-600">
                                        {item.adults > 0 && (
                                            <div className="flex justify-between">
                                                <span>{item.adults} Adult{item.adults > 1 ? 's' : ''} at {formatCurrency(mealNight.adultPrice)} each</span>
                                                <span className="font-medium">{formatCurrency(item.adults * mealNight.adultPrice)}</span>
                                            </div>
                                        )}
                                        {item.children > 0 && (
                                            <div className="flex justify-between">
                                                <span>{item.children} Child{item.children > 1 ? 'ren' : ''} at {formatCurrency(mealNight.childPrice)} each</span>
                                                <span className="font-medium">{formatCurrency(item.children * mealNight.childPrice)}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ml-4 space-y-1 text-xs text-blue-600">
                                        {/* Always show complimentary breakfast for guests within room capacity */}
                                        <div className="flex justify-between">
                                            <span className="text-green-600">{Math.max(0, item.adults + item.children - mealNight.extraGuests)} Guest{Math.max(0, item.adults + item.children - mealNight.extraGuests) > 1 ? 's' : ''} - Complimentary Breakfast (Plated)</span>
                                            <span className="font-medium text-green-600">Free</span>
                                        </div>
                                        {/* Show extra guest breakfast fee if there are extra guests */}
                                        {mealNight.extraGuests > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-orange-600">{mealNight.extraGuests} Extra Guest{mealNight.extraGuests > 1 ? 's' : ''} at {formatCurrency(mealNight.adultBreakfastPrice || 0)} each</span>
                                                <span className="font-medium text-orange-600">{formatCurrency(mealNight.extraGuests * (mealNight.adultBreakfastPrice || 0))}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Total */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-blue-800">Room Meal Total:</span>
                                <span className="text-sm font-bold text-green-600">{formatCurrency(item.roomMealTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extra Guest Fee Breakdown - Only for buffet days */}
            {!isDayTourCart && item.totalGuests > parseInt(item.maxGuests) && mealQuote?.nights?.some(night => night.type === 'buffet' && night.extra_guest_fee > 0) && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <h6 className="text-sm font-medium text-purple-700 mb-2">Extra Guest Fees (Buffet Days)</h6>
                    <div className="space-y-2">
                        {mealQuote.nights
                            .filter(night => night.type === 'buffet' && night.extra_guest_fee > 0)
                            .map((night, index) => {
                                const extraGuestsInRoom = Math.max(0, item.totalGuests - parseInt(item.maxGuests));
                                const extraGuestFeeForThisRoom = extraGuestsInRoom * night.extra_guest_fee;
                                
                                return (
                                    <div key={index} className="border-b border-purple-200 pb-2 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-purple-700">
                                                {formatBuffetDate(night.date)} - Extra Guest Fee
                                            </span>
                                            <span className="text-sm font-semibold text-purple-900">
                                                {formatCurrency(extraGuestFeeForThisRoom)}
                                            </span>
                                        </div>
                                        <div className="ml-4 text-xs text-purple-600">
                                            <div className="flex justify-between">
                                                <span>{extraGuestsInRoom} Extra Guest{extraGuestsInRoom > 1 ? 's' : ''} at {formatCurrency(night.extra_guest_fee)} each</span>
                                                <span className="font-medium">{formatCurrency(extraGuestFeeForThisRoom)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        
                        {/* Total Extra Guest Fees */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-purple-800">Total Extra Guest Fees:</span>
                                <span className="text-sm font-bold text-purple-600">
                                    {formatCurrency(
                                        mealQuote.nights
                                            .filter(night => night.type === 'buffet' && night.extra_guest_fee > 0)
                                            .reduce((total, night) => {
                                                const extraGuestsInRoom = Math.max(0, item.totalGuests - parseInt(item.maxGuests));
                                                return total + (extraGuestsInRoom * night.extra_guest_fee);
                                            }, 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span>
                    {formatCurrency(
                        item.subtotal + 
                        (item.roomMealTotal || 0) + 
                        (mealQuote?.nights
                            ?.filter(night => night.type === 'buffet' && night.extra_guest_fee > 0)
                            ?.reduce((total, night) => {
                                const extraGuestsInRoom = Math.max(0, item.totalGuests - parseInt(item.maxGuests));
                                return total + (extraGuestsInRoom * night.extra_guest_fee);
                            }, 0) || 0)
                    )}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span>Total Guests:</span>
                <span>{item.totalGuests}</span>
            </div>
        </div>
            ))}
            
            {/* Quick Booking Dialog for adding another overnight room */}
            {selectedRoomForBooking && (
                <QuickBookingDialog
                    open={showBookingDialog}
                    onOpenChange={setShowBookingDialog}
                    room={selectedRoomForBooking}
                    availableUnits={undefined} // We'll let the dialog handle availability checking
                    isUnavailable={false}
                    availabilityLoading={false}
                />
            )}

            {/* Day Tour Add to Cart Dialog for adding another Day Tour room */}
            {selectedDayTourRoom && (
                <DayTourAddToCartDialog
                    open={showDayTourDialog}
                    onOpenChange={setShowDayTourDialog}
                    room={selectedDayTourRoom}
                    currentPricing={currentPricing}
                    availability={mealProgram}
                    selectedDate={state.dayTourDate}
                    onConfirm={(room, adults, children, includeLunch, includePmSnack) => {
                        // Handle adding another Day Tour room to cart
                        // This uses the same logic as in DayTour.jsx
                        const totalGuests = adults + children;
                        const pricePerPax = currentPricing?.price_per_pax || room.price || 0;
                        const basePrice = pricePerPax * totalGuests;
                        
                        let lunchCost = 0;
                        let pmSnackCost = 0;
                        
                        if (includeLunch && mealProgram?.buffet_active && mealProgram?.lunch_prices) {
                            lunchCost = (adults * mealProgram.lunch_prices.adult) + (children * mealProgram.lunch_prices.child);
                        }
                        
                        if (includePmSnack && mealProgram?.pm_snack_prices) {
                            pmSnackCost = (adults * mealProgram.pm_snack_prices.adult) + (children * mealProgram.pm_snack_prices.child);
                        }
                        
                        const mealCost = lunchCost + pmSnackCost;
                        const totalPrice = basePrice + mealCost;
                        
                        const cartItem = {
                            roomId: room.slug,
                            name: room.name,
                            price: totalPrice,
                            basePrice: basePrice,
                            mealCost: mealCost,
                            lunchCost: lunchCost,
                            pmSnackCost: pmSnackCost,
                            pricePerPax: pricePerPax,
                            adults: parseInt(adults),
                            children: parseInt(children),
                            totalGuests: totalGuests,
                            maxGuests: room.max_guests,
                            extraGuests: room.extra_guests,
                            minGuests: room.min_guests || 1,
                            maxGuestsRange: room.max_guests_range || room.max_guests,
                            roomType: 'day_tour',
                            dayTourDate: state.dayTourDate,
                            includeLunch: includeLunch,
                            includePmSnack: includePmSnack || (mealProgram?.pm_snack_policy === 'required')
                        };
                        
                        
                        // Add to cart using the cart context
                        addItem(cartItem);
                        
                        // Close dialog
                        setShowDayTourDialog(false);
                        setSelectedDayTourRoom(null);
                    }}
                />
            )}
        </>
    );
}

export default CartList