import { useCart } from "../context/CartContext";
import { usePromoCode } from "../context/PromoCodeContext";
import { formatCurrency } from "@/lib/format";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { useLoader } from "@/context/LoaderContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartSummaryWithMealPrograms } from "../hooks/cart/useCartSummaryWithMealPrograms";
import MealAvailabilityBadges from "../components/booking/MealAvailabilityBadges";
import { useApi } from "@/hooks/useApi";
import { Separator } from "@radix-ui/react-select";
import { API_PREFIX } from "@/constants/api";
import SeaWaveBg from "../components/common/SeaWaveBg";
import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { hasDayTourItems } from "@/utils/roomTypeUtils";
import { fetchDayTourAvailability } from "@/services/dayTour";

const FormSchema = z.object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    contactNumber: z.string().min(1, { message: "Contact number is required" }),
    specialRequests: z.string().optional(),
});

const CheckoutPage = () => {
    const { state: { items, checkIn, checkOut }, clear } = useCart();
    const { navigate } = useAppContext();
    const { show, hide } = useLoader();
    const { summary, grandTotal, totalGuests, numNights, totalAdults, totalChildren, roomTotalPrice, mealCost, mealQuote, mealLoading, isDayTourCart } = useCartSummaryWithMealPrograms();
    const { promoCode, promoInfo, promoError, setPromoCode, clearPromo, applyPromo } = usePromoCode();
    const api = useApi();
    const [dayTourMealData, setDayTourMealData] = useState(null);

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            contactNumber: "",
            specialRequests: "",
        }
    });

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

    const checkAvailability = async () => {
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
                
                if (unavailableItems.length > 0) {
                    // Show error message with unavailable rooms
                    const unavailableRoomNames = unavailableItems.map(item => item.room_name).join(', ');
                    toast.error(`The following rooms are no longer available: ${unavailableRoomNames}. Please return to your cart to remove them.`);
                    navigate('/cart');
                    return false;
                }
                
                return true;
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
                
                if (unavailableItems.length > 0) {
                    // Show error message with unavailable rooms
                    const unavailableRoomNames = unavailableItems.map(item => item.room_name).join(', ');
                    toast.error(`The following rooms are no longer available: ${unavailableRoomNames}. Please return to your cart to remove them.`);
                    navigate('/cart');
                    return false;
                }
                
                return true;
            }
        } catch (e) {
            console.error('Availability check error:', e);
            toast.error("Error checking availability. Please try again.");
            return false;
        }
    };

    const onSubmit = async (data) => {
        show();
        
        // First, check availability before proceeding with booking
        const availabilityOk = await checkAvailability();
        if (!availabilityOk) {
            hide();
            return;
        }
        
        // Check if this is a Day Tour booking
        const isDayTour = items.some(item => item.roomType === 'day_tour');
        
        if (isDayTour) {
            // Day Tour booking
            const dayTourDate = items.find(item => item.dayTourDate)?.dayTourDate;
            
            const bookingPayload = {
                date: dayTourDate,
                selections: summary.map(item => ({
                    room_id: item.roomId,
                    adults: item.adults,
                    children: item.children,
                    include_lunch: item.includeLunch || false,
                    include_pm_snack: item.includePmSnack || false,
                    lunch_cost: item.lunchCost || 0,
                    pm_snack_cost: item.pmSnackCost || 0,
                    meal_cost: item.mealCost || 0
                })),
                guest: {
                    name: data.fullName,
                    email: data.email,
                    phone: data.contactNumber
                },
                special_requests: data.specialRequests,
                // Include totals for validation
                totals: {
                    room_total: roomTotalPrice,
                    meal_total: mealCost,
                    grand_total: grandTotal
                }
            };
            
            try {
                const bookingRes = await api.post(`${API_PREFIX}/bookings/day-tour`, bookingPayload, {
                    headers: { "Content-Type": "application/json" },
                });
                const booking = bookingRes.data;
                if (!booking?.reference_number) {
                    toast.error(bookingRes.data?.message || "Day Tour booking failed");
                    hide();
                    return;
                }
                clear();
                navigate(`/booking/${booking.reference_number}/payment`);
            } catch (err) {
                console.error('Day Tour checkout error:', err);
                toast.error(err.response?.data?.message || "Something went wrong. Try again.");
            } finally {
                hide();
            }
        } else {
            // Overnight booking (existing logic)
            const bookingPayload = {
                check_in_date: checkIn,
                check_out_date: checkOut,
                rooms: summary.map(item => ({
                    room_unique_id: item.uniqueId,
                    room_id: item.roomId,
                    adults: item.adults,
                    children: item.children,
                })),
                guest_name: data.fullName,
                guest_email: data.email,
                guest_phone: data.contactNumber,
                special_requests: data.specialRequests,
                total_adults: totalAdults,
                total_children: totalChildren
            };
            if (promoInfo) {
                bookingPayload.promo_id = promoInfo.id;
            }
            
            try {
                const bookingRes = await api.post(`${API_PREFIX}/bookings`, bookingPayload, {
                    headers: { "Content-Type": "application/json" },
                });
                const booking = bookingRes.data;
                if (!booking?.reference_number) {
                    toast.error(bookingRes.data?.message || "Booking failed");
                    hide();
                    return;
                }
                clear();
                clearPromo(); // Clear promo code after successful booking
                navigate(`/booking/${booking.reference_number}/payment`);
            } catch (err) {
                console.error('Checkout error:', err);
                if (err.status === 409) {
                    toast.error(err.response.data.error);
                    return
                }
                toast.error("Something went wrong. Try again.");
            } finally {
                hide();
            }
        }
    };

    const handleApplyPromo = async () => {
        await applyPromo(api, promoCode, roomTotalPrice, mealCost, grandTotal);
    };
    return (
        <div className="relative min-h-screen pb-[200px] py-16 px-2 md:px-8 lg:px-32 mt-10 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <SEO title="Checkout" description="Confirm your booking and guest details." noindex={true} />
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* -- Summary Section -- */}
                <aside className="md:col-span-1 bg-gray-50 rounded-xl shadow-lg p-6 flex flex-col gap-6 static top-auto h-auto md:sticky md:top-24 md:h-fit">
                    <h2 className="text-xl font-semibold mb-2">Booking Summary</h2>

                    {/* Promo code field */}
                    <div className="flex items-center gap-2 mt-2">
                        <Input
                            type="text"
                            placeholder="Promo code"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            className="w-40"
                        />
                        {promoInfo ? (
                            <Button type="button" variant="outline" onClick={clearPromo}>Remove</Button>
                        ) : (
                            <Button type="button" onClick={handleApplyPromo}>Apply</Button>
                        )}
                    </div>
                    {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
                    {promoInfo && (
                        <p className="text-sm text-green-600 mt-1">
                            Promo "{promoInfo.code}" applied – {promoInfo.discount_type === 'percentage'
                                ? `${promoInfo.discount_value}% off`
                                : `${formatCurrency(promoInfo.discount_value)} off`}!
                        </p>
                    )}
                    <div className="space-y-1 text-sm">
                        {isDayTourCart ? (
                            <>
                                <div className="flex justify-between">
                                    <span>Day Tour Date</span>
                                    <span>{items.find(item => item.dayTourDate)?.dayTourDate || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total guests</span>
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
                                    <span>Total guests</span>
                                    <span>{totalGuests}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="space-y-3 mt-4">
                        {summary.map(item => (
                            <div key={item.uniqueId} className="bg-white rounded-lg p-3 border">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{item.name}</span>
                                    <span className="font-bold text-sm">{formatCurrency(item.subtotal)}</span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>{item.adults > 0 ? `${item.adults}A` : ''} {item.children > 0 ? `, ${item.children}C` : ''}</span>
                                        <span>
                                            {isDayTourCart 
                                                ? `${formatCurrency(item.pricePerPax)} per person`
                                                : `${item.numNights} night${item.numNights > 1 ? "s" : ""}`
                                            }
                                        </span>
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
                    {/* Meal Availability Badges - Only for overnight bookings */}
                    {!isDayTourCart && <MealAvailabilityBadges checkIn={checkIn} checkOut={checkOut} className="my-2" mealQuote={mealQuote} />}
                    
                    {/* Price breakdown for both overnight and day tour */}
                    <div className="flex justify-between text-sm font-medium">
                        <span>Total Room Price:</span>
                        <span>{formatCurrency(roomTotalPrice)}</span>
                    </div>
                    
                    {/* Meal breakdown - different for overnight vs day tour */}
                    {isDayTourCart ? (
                        <div className="flex justify-between text-sm font-medium">
                            <span>Meals (Lunch & PM Snack):</span>
                            <span>{formatCurrency(mealCost)}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-sm font-medium">
                            <span>
                                {mealLoading ? (
                                    "Meals:"
                                ) : mealQuote && mealQuote.nights ? (
                                    mealQuote.nights.every(night => night.type === 'buffet') ? (
                                        `Buffet Meals (${totalAdults}A${totalChildren > 0 ? `, ${totalChildren}C` : ''})`
                                    ) : (
                                        "Complimentary Breakfast Only"
                                    )
                                ) : (
                                    "Meals:"
                                )}
                            </span>
                            <span>
                                {mealLoading ? (
                                    <span className="text-xs text-gray-500">Loading...</span>
                                ) : (
                                    formatCurrency(mealCost)
                                )}
                            </span>
                        </div>
                    )}
                    
                    {/* Subtotal - same for both booking types */}
                    <div className="flex justify-between text-sm font-medium">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(roomTotalPrice + mealCost)}</span>
                    </div>
                    {promoInfo && promoInfo.discountAmount > 0 && (
                        <div className="flex justify-between text-sm font-medium text-green-600">
                            <span>Promo Discount ({promoInfo.code}):</span>
                            <span>-{formatCurrency(promoInfo.discountAmount)}</span>
                        </div>
                    )}
                    <div className="mt-4 flex justify-between border-t pt-4 font-bold text-lg">
                        <span>Grand Total</span><span>
                            {formatCurrency(
                                promoInfo
                                    ? Math.max(0, grandTotal - (promoInfo.discountAmount || 0))
                                    : grandTotal
                            )}
                        </span>
                    </div>
                </aside>
                {/* -- Guest Info -- */}
                {!(!items || !Array.isArray(items) || items.length === 0) && (
                    <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">
                        {/* Back to Cart Button */}
                        <div className="flex justify-start">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/cart')}
                                className="mb-4"
                            >
                                ← Back to Cart
                            </Button>
                        </div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <h2 className="text-xl font-semibold mb-2">Guest Information</h2>
                                <FormField name="fullName" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Full name</FormLabel><FormControl><Input type="text" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="email" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="contactNumber" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="text" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="specialRequests" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Special Requests</FormLabel><FormControl><Textarea placeholder="Tell us if you need some assistance" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button className="w-full mt-4 cursor-pointer" type="submit">
                                    Reserve Now
                                </Button>
                            </form>
                        </Form>
                    </div>
                )}
            </div>
            <SeaWaveBg />
        </div>
    );
};

export default CheckoutPage;
