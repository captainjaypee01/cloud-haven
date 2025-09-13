import { useState, useEffect } from "react";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "../context/CartContext";
import { usePromoCode } from "../context/PromoCodeContext";
import { Trash } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { GuestSelector } from "./GuestSelector";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { Separator } from "@radix-ui/react-select";
// import { differenceInDays, parseISO } from "date-fns";
import { useCartSummaryWithMealPrograms } from "../hooks/cart/useCartSummaryWithMealPrograms";
import { useSyncCartForm } from "../hooks/cart/useSyncCartForm";
import MealAvailabilityBadges from "./booking/MealAvailabilityBadges";
import { useApi } from "@/hooks/useApi";
import { Link } from "react-router-dom";
import { hasDayTourItems } from "@/utils/roomTypeUtils";
import { fetchDayTourAvailability } from "@/services/dayTour";
import { Checkbox } from "@/components/ui/checkbox";

export function CartPopup() {
    const [open, setOpen] = useState(false);
    const [dayTourMealData, setDayTourMealData] = useState(null);
    const {
        state: { items, checkIn, checkOut },
        updateItem,
        removeItem,
    } = useCart();

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
    const { control, clearErrors, reset } = useForm();
    const { summary, grandTotal, numNights, totalAdults, totalChildren, mealCost, roomTotalPrice, totalGuests, mealQuote, mealLoading, isDayTourCart } = useCartSummaryWithMealPrograms();
    const { promoCode, promoInfo, promoError, setPromoCode, clearPromo, applyPromo } = usePromoCode();
    const api = useApi();
    useSyncCartForm(items, reset);

    // Fetch Day Tour meal program data when there are Day Tour items
    useEffect(() => {
        const fetchDayTourMealData = async () => {
            if (isDayTourCart && items.length > 0) {
                const dayTourDate = items.find(item => item.dayTourDate)?.dayTourDate;
                if (dayTourDate) {
                    try {
                        const mealData = await fetchDayTourAvailability(api, dayTourDate);
                        setDayTourMealData(mealData);
                    } catch (error) {
                        console.error('Failed to fetch Day Tour meal data:', error);
                        setDayTourMealData(null);
                    }
                }
            } else {
                setDayTourMealData(null);
            }
        };

        fetchDayTourMealData();
    }, [isDayTourCart, items, api]);

    const handleApplyPromo = async () => {
        await applyPromo(api, promoCode, roomTotalPrice, mealCost, grandTotal);
    };

    const handleRemovePromo = () => {
        clearPromo();
    };

    const handleChange = (item, type, val) => {
        const newCount = Number(val);
        const adults = type === "adults" ? newCount : item.adults;
        const children = type === "children" ? newCount : item.children;
        const total = adults + children;

        if (total < 1) {
            toast.error("At least one guest required.");
            return;
        }
        if (total > parseInt(item.maxGuests) + parseInt(item.extraGuests)) {
            toast.error(`Only up to ${parseInt(item.maxGuests) + parseInt(item.extraGuests)} guests can stay in this room.`);
            return;
        }
        if (total > parseInt(item.maxGuests)) {
            toast.warning(
                `Max ${item.maxGuests} guests allowed (you have ${total}). We allow for ${item.extraGuests} extra guest/s`
            );
        }

        clearErrors(`${item.uniqueId}`);

        // For Day Tour items, recalculate the total price when guest count changes
        let updatedItem = { adults, children, guests: total };
        if (item.roomType === 'day_tour' && item.pricePerPax) {
            const newBasePrice = item.pricePerPax * total;

            // Recalculate meal costs based on new guest counts
            let newMealCost = 0;
            let newLunchCost = 0;
            let newPmSnackCost = 0;

            if (dayTourMealData && dayTourMealData.buffet_active) {
                // Recalculate buffet lunch cost
                if (item.includeLunch && dayTourMealData.lunch_prices) {
                    newLunchCost = (adults * dayTourMealData.lunch_prices.adult) +
                        (children * dayTourMealData.lunch_prices.child);
                }

                // Recalculate PM snack cost
                if (item.includePmSnack && dayTourMealData.pm_snack_prices) {
                    newPmSnackCost = (adults * dayTourMealData.pm_snack_prices.adult) +
                        (children * dayTourMealData.pm_snack_prices.child);
                }

                newMealCost = newLunchCost + newPmSnackCost;
            }

            const newTotalPrice = newBasePrice + newMealCost;

            updatedItem = {
                ...updatedItem,
                price: newTotalPrice,
                basePrice: newBasePrice,
                mealCost: newMealCost,
                lunchCost: newLunchCost,
                pmSnackCost: newPmSnackCost
            };
        }

        updateItem(item.uniqueId, updatedItem);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="cursor-pointer">🛒 Cart ({items.length})</Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 space-y-4">
                <h3 className="text-lg font-semibold">Your Booking Cart</h3>
                {/* --- Dates Summary --- */}
                <div className="space-y-1 text-sm text-gray-700">
                    {isDayTourCart ? (
                        <>
                            <div className="flex justify-between">
                                <span>Day Tour Date</span>
                                <span>{items.find(item => item.dayTourDate)?.dayTourDate || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Number of guests</span>
                                <span>{totalGuests}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <span>Check-in</span>
                                <span>{checkIn || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Check-out</span>
                                <span>{checkOut || "—"}</span>
                            </div>
                            {!isDayTourCart && (
                                <div className="flex justify-between">
                                    <span>Nights</span>
                                    <span>{numNights}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Number of guests</span>
                                <span>{totalGuests}</span>
                            </div>
                        </>
                    )}
                </div>
                {/* Meal Availability Badges - Only for overnight bookings */}
                {/* {!isDayTourCart && <MealAvailabilityBadges checkIn={checkIn} checkOut={checkOut} className="mt-2" mealQuote={mealQuote} />} */}
                {items.length === 0 ? (
                    <p className="text-sm text-gray-500">No rooms added.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
                        {summary.map((item) => (
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
                                        className="text-red-600 hover:text-red-800 hover:underline cursor-pointer"
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
                                                    maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
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
                                                    maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
                                                    value={field.value}
                                                    onChange={v => handleChange(item, "children", v)}
                                                    isPopover={true}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                {/* Subtotals */}
                                {isDayTourCart ? (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Day Tour Price:</span>
                                            <span>
                                                {formatCurrency(item.pricePerPax)} × {item.totalGuests} guest{item.totalGuests > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {isDayTourCart && (
                                            <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-2">
                                                <h6 className="text-xs font-medium text-gray-700">Meal Add-ons</h6>
                                                
                                                {/* Buffet Lunch Option */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`popup-lunch-${item.uniqueId}`}
                                                            checked={item.includeLunch || false}
                                                            onCheckedChange={(checked) => handleMealOptionChange(item, 'lunch', checked)}
                                                            disabled={!dayTourMealData?.buffet_active}
                                                            className="cursor-pointer"
                                                        />
                                                        <div>
                                                            <label htmlFor={`popup-lunch-${item.uniqueId}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                                                                Buffet Lunch
                                                                {!dayTourMealData?.buffet_active && (
                                                                    <span className="ml-1 text-xs text-gray-500">(Not available)</span>
                                                                )}
                                                            </label>
                                                            {item.includeLunch && dayTourMealData?.lunch_prices && (
                                                                <div className="text-xs text-gray-500">
                                                                    {item.adults} adult{item.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.lunch_prices.adult)}
                                                                    {item.children > 0 && (
                                                                        <> + {item.children} child{item.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.lunch_prices.child)}</>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-green-600">
                                                        {item.includeLunch && item.lunchCost > 0 ? formatCurrency(item.lunchCost) : "—"}
                                                    </span>
                                                </div>
                                                
                                                {/* PM Snack Option */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`popup-pmSnack-${item.uniqueId}`}
                                                            checked={item.includePmSnack || false}
                                                            onCheckedChange={(checked) => handleMealOptionChange(item, 'pmSnack', checked)}
                                                            disabled={dayTourMealData?.pm_snack_policy === 'hidden'}
                                                            className="cursor-pointer"
                                                        />
                                                        <div>
                                                            <label htmlFor={`popup-pmSnack-${item.uniqueId}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                                                                PM Snack
                                                                {dayTourMealData?.pm_snack_policy === 'hidden' && (
                                                                    <span className="ml-1 text-xs text-gray-500">(Not available)</span>
                                                                )}
                                                                {dayTourMealData?.pm_snack_policy === 'required' && (
                                                                    <span className="ml-1 text-xs text-orange-600">(Required)</span>
                                                                )}
                                                            </label>
                                                            {item.includePmSnack && dayTourMealData?.pm_snack_prices && (
                                                                <div className="text-xs text-gray-500">
                                                                    {item.adults} adult{item.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.adult)}
                                                                    {item.children > 0 && (
                                                                        <> + {item.children} child{item.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.child)}</>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-green-600">
                                                        {item.includePmSnack && item.pmSnackCost > 0 ? formatCurrency(item.pmSnackCost) : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-medium">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(item.subtotal)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Room Price:</span>
                                            <span>
                                                {formatCurrency(item.price)} x {numNights} night{numNights > 1 ? "s" : ""} = {formatCurrency(item.subtotal)}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* Per-room meal breakdown */}
                                {!isDayTourCart && item.hasRoomMealBreakdown && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                        <h6 className="text-xs font-medium text-blue-700 mb-1">Meal Breakdown for this Room</h6>
                                        <div className="space-y-2">
                                            {item.mealBreakdown.map((mealNight, index) => (
                                                <div key={index} className="border-b border-blue-200 pb-2 last:border-b-0 last:pb-0">
                                                    {/* Date Header */}
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-blue-700">
                                                            {new Date(mealNight.date).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })} - {mealNight.type === 'buffet' ? 'Buffet' : 'Free Breakfast'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-blue-900">
                                                            {formatCurrency(mealNight.cost)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Breakdown Details */}
                                                    {mealNight.type === 'buffet' ? (
                                                        <div className="ml-3 space-y-0.5 text-xs text-blue-600">
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
                                                        <div className="ml-3 space-y-0.5 text-xs text-blue-600">
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
                                            <div className="pt-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-blue-800">Room Meal Total:</span>
                                                    <span className="text-xs font-bold text-green-600">{formatCurrency(item.roomMealTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Subtotal after meal breakdown */}
                                {!isDayTourCart && (
                                    <div className="flex justify-between font-medium mt-2">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(item.subtotal + (item.roomMealTotal || 0))}</span>
                                    </div>
                                )}
                                
                                {/* Extra Guest Warning for Overnight Bookings in Popup - Only show on free breakfast days */}
                                {!isDayTourCart && item.totalGuests > parseInt(item.maxGuests) && mealQuote?.nights?.some(night => night.type === 'free_breakfast') && (
                                    <div className="mt-1 p-1.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                                        ⚠️ {item.totalGuests - parseInt(item.maxGuests)} extra guest{item.totalGuests - parseInt(item.maxGuests) > 1 ? 's' : ''} may incur breakfast fees
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-between text-sm font-medium">
                            <span>{isDayTourCart ? 'Total Day Tour Price:' : 'Total Room Price:'}</span>
                            <span>{formatCurrency(roomTotalPrice)}</span>
                        </div>


                        {/* Meal Summary - Only for overnight bookings */}
                        {!isDayTourCart && (
                            <>
                                {/* Combined meal display */}
                                {!mealLoading && mealQuote && mealQuote.nights && (
                                    <>
                                        {/* Buffet Meals */}
                                        {mealQuote.nights.some(night => night.type === 'buffet') && (
                                            <div className="flex justify-between text-xs font-medium">
                                                <div className="flex flex-col">
                                                    <span>
                                                        {totalAdults > 0 || totalChildren > 0 ? 
                                                            `Buffet Meals (${totalAdults}A${totalChildren > 0 ? `, ${totalChildren}C` : ''})` :
                                                            "Buffet Available"
                                                        }
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {mealQuote.nights
                                                            .filter(night => night.type === 'buffet')
                                                            .map(night => new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                                <span>
                                                    {formatCurrency(mealQuote.nights
                                                        .filter(night => night.type === 'buffet')
                                                        .reduce((total, night) => total + (night.night_total || 0), 0)
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Complimentary Breakfast - separate line */}
                                        {mealQuote.nights.some(night => night.type === 'free_breakfast') && (
                                            <div className="flex justify-between text-xs font-medium">
                                                <div className="flex flex-col">
                                                    <span>
                                                        Complimentary Breakfast ({totalAdults + totalChildren - (mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0)} guest{totalAdults + totalChildren - (mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0) > 1 ? 's' : ''})
                                                        <p className="text-xs text-gray-500 mt-1">Plated</p>
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {mealQuote.nights
                                                            .filter(night => night.type === 'free_breakfast')
                                                            .map(night => new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                                <span className="text-green-600 text-xs">Free</span>
                                            </div>
                                        )}
                                        
                                        {/* Extra Guest Breakfast Fees - separate line */}
                                        {mealQuote.nights.some(night => night.breakfast_total > 0) && (
                                            <div className="flex justify-between text-xs font-medium">
                                                <div className="flex flex-col">
                                                    <span>
                                                        Extra Guest ({mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0} guest{(mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0) > 1 ? 's' : ''})
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {mealQuote.nights
                                                            .filter(night => night.breakfast_total > 0)
                                                            .map(night => new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                                                            .join(', ')
                                                        }
                                                    </div>
                                                </div>
                                                <span className="text-orange-600 text-xs">
                                                    {formatCurrency(mealQuote.nights
                                                        .reduce((total, night) => total + (night.breakfast_total || 0), 0)
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {/* Loading state */}
                                {mealLoading && (
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>Meals:</span>
                                        <span className="text-xs text-gray-500">Loading...</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Promo Code Section */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="Promo code"
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value)}
                                    className="flex-1 text-sm"
                                />
                                {promoInfo ? (
                                    <Button type="button" variant="outline" size="sm" onClick={handleRemovePromo}>
                                        Remove
                                    </Button>
                                ) : (
                                    <Button type="button" size="sm" onClick={handleApplyPromo}>
                                        Apply
                                    </Button>
                                )}
                            </div>
                            {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                            {promoInfo && (
                                <p className="text-xs text-green-600">
                                    Promo "{promoInfo.code}" applied – {promoInfo.discount_type === 'percentage'
                                        ? `${promoInfo.discount_value}% off`
                                        : `${formatCurrency(promoInfo.discount_value)} off`}!
                                </p>
                            )}
                        </div>

                        <Separator />
                        <div className="flex justify-between text-sm font-medium">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        {promoInfo && promoInfo.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Promo Discount ({promoInfo.code}):</span>
                                <span>-{formatCurrency(promoInfo.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-lg font-semibold">Total:</span>
                            <span className="text-lg font-bold">
                                {formatCurrency(
                                    promoInfo
                                        ? Math.max(0, grandTotal - (promoInfo.discountAmount || 0))
                                        : grandTotal
                                )}
                            </span>
                        </div>
                    </div>
                )}
                {items.length > 0 && (
                    <Button asChild variant="ghost" className="w-full">
                        <Link to="/cart">View Cart</Link>
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}
