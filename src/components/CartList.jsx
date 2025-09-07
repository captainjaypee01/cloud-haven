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

const CartList = ({
    summary = [],
    removeItem = () => { },
    handleChange = () => { },
    handleView = () => { },
    control,
    numNights = 1, // pass from parent
    isDayTourCart = false, // pass from parent
    dayTourMealData = null, // meal program data for Day Tour
}) => {
    const { state, updateItem, addItem, currentPricing, mealProgram } = useCart();
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
            console.log('CartList - Adding another Day Tour room with data:', dayTourRoom);
            console.log('CartList - Original Day Tour item data:', item);
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
            console.log('CartList - Adding another overnight room with data:', roomForBooking);
            console.log('CartList - Original overnight item data:', item);
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
                        
                        console.log('CartList - Adding Day Tour item to cart:', cartItem);
                        
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