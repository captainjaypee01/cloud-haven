import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { useCart } from "../context/CartContext";
import { usePromoCode } from "../context/PromoCodeContext";
import { GuestSelector } from "../components/GuestSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { Separator } from "@radix-ui/react-select";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import { Trash } from "lucide-react";
import CartList from "../components/CartList";
import { RoomDetailModal } from "../components/RoomDetailModal";
import { useAppContext } from "../context/AppContext";
import { differenceInDays, parseISO } from "date-fns";
import { useCartSummaryWithMealPrograms } from "../hooks/cart/useCartSummaryWithMealPrograms";
import { useSyncCartForm } from "../hooks/cart/useSyncCartForm";
import MealAvailabilityBadges from "../components/booking/MealAvailabilityBadges";
import AvailabilityModal from "../components/common/AvailabilityModal";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { useLoader } from "@/context/LoaderContext";
import SeaWaveBg from "../components/common/SeaWaveBg";
import { hasDayTourItems } from "@/utils/roomTypeUtils";
import { fetchDayTourAvailability } from "@/services/dayTour";

const Cart = () => {
    const api = useApi();
    const { state: { items, checkIn, checkOut }, updateItem, removeItem, clear } = useCart();
    const { show, hide } = useLoader();
    const { control, reset, clearErrors } = useForm();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [checking, setChecking] = useState(false);
    const [unavailable, setUnavailable] = useState([]);
    const [dayTourMealData, setDayTourMealData] = useState(null);
    const { navigate } = useAppContext();
    const { summary, grandTotal, totalGuests, numNights, totalAdults, totalChildren, mealCost, roomTotalPrice, mealQuote, mealLoading, isDayTourCart } = useCartSummaryWithMealPrograms();
    const { promoCode, promoInfo, promoError, setPromoCode, clearPromo, applyPromo } = usePromoCode();
    // Keep form in sync with cart summary
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

    const handleClearCart = () => {
        clear(); // Clear cart items
        clearPromo(false); // Clear promo code silently
    };

    const checkAvailability = async () => {
        show();
        setChecking(true);
        try {
            if (isDayTourCart) {
                // For Day Tour, use the new batch availability check endpoint
                const dayTourDate = items.find(item => item.dayTourDate)?.dayTourDate;
                if (!dayTourDate) {
                    toast.error("Day Tour date not found.");
                    return false;
                }

                // Group items by room_id to count how many of each room type we're requesting
                const roomCounts = {};
                summary.forEach(item => {
                    roomCounts[item.roomId] = (roomCounts[item.roomId] || 0) + 1;
                });

                // Convert to the format expected by the batch check API
                const itemsToCheck = Object.entries(roomCounts).map(([roomId, count]) => ({
                    room_id: roomId,
                    requested_count: count
                }));

                const res = await api.post(`${API_PREFIX}/day-tours/availability`, {
                    date: dayTourDate,
                    items: itemsToCheck
                });

                // Filter out unavailable items
                const unavailableItems = res.data.filter(
                    x => !x.available || x.available_count < x.requested_count
                );
                setUnavailable(unavailableItems);
                return unavailableItems.length === 0;
            } else {
                // For overnight bookings, use the existing logic
                const res = await api.post(`${API_PREFIX}/rooms/availability`, {
                    items: summary.map(item => ({
                        room_id: item.roomId,
                        requested_count: 1,
                    })),
                    check_in: checkIn,
                    check_out: checkOut,
                });

                const unavailableItems = res.data.filter(
                    x => !x.available || x.available_count < x.requested_count
                );
                setUnavailable(unavailableItems);
                return unavailableItems.length === 0;
            }
        } catch (e) {
            console.error('Availability check error:', e);
            toast.error("Error checking availability. Please try again.");
            return false;
        } finally {
            setChecking(false);
            hide();
        }
    };

    const handleProceedToCheckout = async () => {
        const ok = await checkAvailability();
        if (ok) {
            // Pass promo information to checkout page via localStorage
            if (promoInfo) {
                localStorage.setItem('checkout_promo_info', JSON.stringify(promoInfo));
            } else {
                localStorage.removeItem('checkout_promo_info');
            }
            scrollTo(0, 0);
            navigate('/checkout');
        }
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
                `Max ${item.maxGuests} guests allowed (you have ${total}). We only allow for ${item.extraGuests} extra guest/s`
            );
        }

        clearErrors(item.uniqueId);
        
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

    const handleView = (id) => {
        setSelectedRoomId(id);
        setModalOpen(true);
    };

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center mt-10 py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO title="Cart" description="Your selected rooms and booking details." noindex={true} />
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white rounded-2xl shadow-lg p-6 md:p-10 mt-10">
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
                                isDayTourCart={isDayTourCart}
                                dayTourMealData={dayTourMealData}
                                mealQuote={mealQuote}
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
                                    <span>Check-in date</span>
                                    <span>{checkIn || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Check-out date</span>
                                    <span>{checkOut || "—"}</span>
                                </div>
                                {!isDayTourCart && (
                                    <div className="flex justify-between">
                                        <span>Number of nights</span>
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
                    {!isDayTourCart && <MealAvailabilityBadges checkIn={checkIn} checkOut={checkOut} className="mt-4" mealQuote={mealQuote} />}
                    <div className="space-y-3">
                        {summary.map(item => (
                            <div key={item.uniqueId} className="bg-white rounded-lg p-3 border">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{item.name}</span>
                                    <span className="font-bold text-sm">{formatCurrency(item.subtotal)}</span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>
                                            {isDayTourCart 
                                                ? `${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''}`
                                                : `${item.adults} Adult${item.adults > 1 ? 's' : ''}${item.children > 0 ? `, ${item.children} Child${item.children > 1 ? 'ren' : ''}` : ''}`
                                            }
                                        </span>
                                        {isDayTourCart && (
                                            <span>
                                                {`${formatCurrency(item.pricePerPax)} per person`}
                                            </span>
                                        )}
                                    </div>
                                    {isDayTourCart && item.includeLunch && dayTourMealData?.lunch_prices && (
                                        <div className="flex justify-between">
                                            <span>Buffet Lunch</span>
                                            <span>{formatCurrency(dayTourMealData.lunch_prices.adult)} per person</span>
                                        </div>
                                    )}
                                    {isDayTourCart && (item.includePmSnack || dayTourMealData?.pm_snack_policy === 'required') && dayTourMealData?.pm_snack_prices && (
                                        <div className="flex justify-between">
                                            <span>
                                                PM Snack
                                                {dayTourMealData?.pm_snack_policy === 'required' && (
                                                    <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">Required</span>
                                                )}
                                            </span>
                                            <span>{formatCurrency(dayTourMealData.pm_snack_prices.adult)} per person</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* For overnight bookings, show detailed breakdown */}
                    {!isDayTourCart && (
                        <>
                            <div className="flex justify-between text-sm font-medium">
                                <span>Total Room Price:</span>
                                <span>{formatCurrency(roomTotalPrice)}</span>
                            </div>
                            {/* Combined meal display */}
                            {!mealLoading && mealQuote && mealQuote.nights && (
                                <>
                                    {/* Buffet Meals */}
                                    {mealQuote.nights.some(night => night.type === 'buffet') && (
                                        <div className="flex justify-between text-sm font-medium">
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
                                        <div className="flex justify-between text-sm font-medium">
                                            <div className="flex flex-col">
                                                <span>
                                                    Complimentary Breakfast ({totalAdults + totalChildren - (mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0)} guest{totalAdults + totalChildren - (mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0) > 1 ? 's' : ''})
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {mealQuote.nights
                                                        .filter(night => night.type === 'free_breakfast')
                                                        .map(night => new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                                                        .join(', ')
                                                    }
                                                </div>
                                            </div>
                                            <span className="text-green-600">Free</span>
                                        </div>
                                    )}
                                    
                                    {/* Extra Guest Breakfast Fees - separate line */}
                                    {mealQuote.nights.some(night => night.breakfast_total > 0) && (
                                        <div className="flex justify-between text-sm font-medium">
                                            <div className="flex flex-col">
                                                <span>
                                                    Extra Guest Breakfast Fee ({mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0} guest{(mealQuote.nights.find(night => night.type === 'free_breakfast')?.extra_adults || 0) > 1 ? 's' : ''})
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {mealQuote.nights
                                                        .filter(night => night.breakfast_total > 0)
                                                        .map(night => new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
                                                        .join(', ')
                                                    }
                                                </div>
                                            </div>
                                            <span className="text-orange-600">
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
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Meals:</span>
                                    <span className="text-xs text-gray-500">Loading...</span>
                                </div>
                            )}
                            
                            {/* Professional Meal Breakdown */}
                            {mealQuote && mealQuote.nights && !mealLoading && (
                                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Meal Breakdown</h4>
                                    <div className="space-y-4">
                                        {mealQuote.nights.map((night, index) => (
                                            <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                                                {night.type === 'buffet' ? (
                                                    <>
                                                        {/* Date Header for Buffet */}
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {new Date(night.date).toLocaleDateString('en-US', { 
                                                                    weekday: 'short', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })} - Buffet
                                                            </span>
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(night.night_total)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Buffet Breakdown Details */}
                                                        <div className="ml-4 space-y-1 text-xs text-gray-600">
                                                            {totalAdults > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span>{totalAdults} Adult{totalAdults > 1 ? 's' : ''} - {formatCurrency(night.adult_price || 0)} each</span>
                                                                    <span className="font-medium">{formatCurrency(totalAdults * (night.adult_price || 0))}</span>
                                                                </div>
                                                            )}
                                                            {totalChildren > 0 && (
                                                                <div className="flex justify-between">
                                                                    <span>{totalChildren} Child{totalChildren > 1 ? 'ren' : ''} - {formatCurrency(night.child_price || 0)} each</span>
                                                                    <span className="font-medium">{formatCurrency(totalChildren * (night.child_price || 0))}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Simplified Free Breakfast Display */
                                                    <div className="text-sm font-medium text-gray-700">
                                                        <div>
                                                            {new Date(night.date).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                        <div className="text-green-600 font-semibold">
                                                            {(night.adults || 0) + (night.children || 0)} Guest{((night.adults || 0) + (night.children || 0)) > 1 ? 's' : ''} Complimentary Breakfast
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* Total */}
                                        <div className="pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-gray-800">Total Meal Cost</span>
                                                <span className="text-sm font-bold text-green-600">{formatCurrency(mealCost)}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Extra Guest Note */}
                                        {mealQuote.nights.some(night => night.breakfast_total > 0) && (
                                            <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                                                <i>* Extra guest breakfast fees apply to guests beyond room capacity</i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Promo Code Section */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                            <Input
                                type="text"
                                placeholder="Promo code"
                                value={promoCode}
                                onChange={e => setPromoCode(e.target.value)}
                                className="flex-1"
                            />
                            {promoInfo ? (
                                <Button type="button" variant="outline" onClick={handleRemovePromo}>
                                    Remove
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleApplyPromo}>
                                    Apply
                                </Button>
                            )}
                        </div>
                        {promoError && <p className="text-xs text-red-600 mb-2">{promoError}</p>}
                        {promoInfo && (
                            <p className="text-sm text-green-600 mb-2">
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
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Grand Total</span>
                        <span>
                            {formatCurrency(
                                promoInfo
                                    ? Math.max(0, grandTotal - (promoInfo.discountAmount || 0))
                                    : grandTotal
                            )}
                        </span>
                    </div>
                    <Button variant="destructive" className="mt-3 cursor-pointer" onClick={handleClearCart}>Clear Cart</Button>
                    {summary.length > 0 && (
                        <Button variant="outline" size="lg" className="mt-1 cursor-pointer" disabled={checking} onClick={handleProceedToCheckout}>Proceed to Checkout</Button>
                    )}
                </div>
            </div>
            <AvailabilityModal
                open={unavailable.length > 0}
                items={unavailable}
                onClose={() => setUnavailable([])}
                onRefresh={checkAvailability}
                checking={checking}
                isDayTour={isDayTourCart}
            />
            <SeaWaveBg />
        </div>
    );
}

export default Cart;