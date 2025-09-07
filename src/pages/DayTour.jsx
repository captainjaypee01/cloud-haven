import { useState, useEffect } from "react";
import { format } from "date-fns";
import SEO from "@/components/SEO";
import { useApi } from "@/hooks/useApi";
import { useLoader } from "@/context/LoaderContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, MapPin, Calendar, Users } from "lucide-react";
import { DayTourDatePicker } from "@/components/DayTourDatePicker";
import { DayTourRoomCard } from "@/components/dayTour/DayTourRoomCard";
import { DayTourAddToCartDialog } from "@/components/dayTour/DayTourAddToCartDialog";
import { fetchDayTourAvailability, fetchDayTourRooms, fetchCurrentDayTourPricing } from "@/services/dayTour";
import { formatCurrency } from "@/utils/currency";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import RoomsHero from "@/components/RoomsHero";
import { dayTourRoomPhotos } from "@/data/rooms";
import DeleteDialog from "@/components/common/form/DeleteDialog";
import { hasOvernightItems } from "@/utils/roomTypeUtils";
import { useAppContext } from "@/context/AppContext";

export default function DayTour() {
    const api = useApi();
    const { navigate } = useAppContext();
    const { show: showLoader, hide: hideLoader } = useLoader();
    const { state: cartState, addItem, clear: clearCart, setDayTourDate } = useCart();
    
    const [selectedDate, setSelectedDate] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [allDayTourRooms, setAllDayTourRooms] = useState([]);
    const [currentPricing, setCurrentPricing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    
    // Mixing prevention dialog
    const [showMixingDialog, setShowMixingDialog] = useState(false);
    
    // Add to cart dialog state
    const [showAddToCartDialog, setShowAddToCartDialog] = useState(false);
    const [selectedRoomForDialog, setSelectedRoomForDialog] = useState(null);

    const heroImages = dayTourRoomPhotos;

    // Fetch all Day Tour rooms on component mount
    const fetchAllDayTourRooms = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await fetchDayTourRooms(api);
            setAllDayTourRooms(data?.data || []);
        } catch (err) {
            console.error('Failed to fetch Day Tour rooms:', err);
            setError('Failed to load Day Tour rooms. Please try again.');
            toast.error('Failed to load Day Tour rooms');
        } finally {
            setLoading(false);
        }
    };

    // Fetch current pricing for selected date
    const fetchCurrentPricing = async (date) => {
        try {
            const pricingData = await fetchCurrentDayTourPricing(api, format(date, 'yyyy-MM-dd'));
            setCurrentPricing(pricingData || null);
        } catch (err) {
            console.error('Failed to fetch current pricing:', err);
            setCurrentPricing(null);
            // Don't show error toast for pricing - it's not critical
        }
    };

    const fetchAvailability = async (date) => {
        if (!date) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const data = await fetchDayTourAvailability(api, dateStr);
            setAvailability(data);
        } catch (err) {
            console.error('Failed to fetch Day Tour availability:', err);
            setError('Failed to load availability. Please try again.');
            toast.error('Failed to load Day Tour availability');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        
        // Update cart context with Day Tour date
        if (date) {
            setDayTourDate(format(date, 'yyyy-MM-dd'));
            fetchAvailability(date);
            fetchCurrentPricing(date);
        } else {
            setDayTourDate('');
            setAvailability(null);
            setCurrentPricing(null);
        }
    };

    const handleAddToCart = (room) => {
        // Check if date is selected first
        if (!selectedDate) {
            toast.error('Please select a Day Tour date first.');
            return;
        }

        // Check for mixing with overnight bookings in the global cart
        const hasOvernightBookings = hasOvernightItems(cartState.items);
        if (hasOvernightBookings) {
            setShowMixingDialog(true);
            return;
        }

        // Open the dialog with the selected room
        setSelectedRoomForDialog(room);
        setShowAddToCartDialog(true);
    };

    const handleConfirmAddToCart = (room, adults, children, includeLunch, includePmSnack) => {
        // Validate guest counts
        const totalGuests = parseInt(adults) + parseInt(children);
        if (totalGuests === 0) {
            toast.error('Please select at least 1 guest.');
            return;
        }

        if (totalGuests > parseInt(room.max_guests) + parseInt(room.extra_guests)) {
            toast.error(`Only up to ${room.max_guests + room.extra_guests} guests can use this facility.`);
            return;
        }
        
        if (totalGuests > room.max_guests) {
            toast.warning(
                `Max ${room.max_guests} guests allowed (you have ${totalGuests}). We allow for ${room.extra_guests} extra guest/s.`
            );
        }

        // Calculate total price based on current Day Tour pricing
        if (!currentPricing || !currentPricing.price_per_pax) {
            toast.error('Pricing information is not available. Please select a date first.');
            return;
        }
        
        const pricePerPax = currentPricing.price_per_pax;
        const basePrice = pricePerPax * totalGuests;
        
        // Calculate meal costs
        let mealCost = 0;
        let lunchCost = 0;
        let pmSnackCost = 0;
        
        if (availability) {
            // Calculate buffet lunch cost (only when buffet is active)
            if (availability.buffet_active && includeLunch && availability.lunch_prices) {
                lunchCost = (parseInt(adults) * availability.lunch_prices.adult) + 
                           (parseInt(children) * availability.lunch_prices.child);
            }
            
            // Calculate PM snack cost (independent of buffet status)
            const shouldIncludePmSnack = includePmSnack || (availability.pm_snack_policy === 'required');
            if (shouldIncludePmSnack && availability.pm_snack_prices) {
                pmSnackCost = (parseInt(adults) * availability.pm_snack_prices.adult) + 
                             (parseInt(children) * availability.pm_snack_prices.child);
            }
            
            mealCost = lunchCost + pmSnackCost;
        }
        
        const totalPrice = basePrice + mealCost;

        // Add to cart using the new Day Tour pricing model
        const cartItem = {
            roomId: room.slug,
            name: room.name,
            price: totalPrice, // Total price including meals
            basePrice: basePrice, // Base Day Tour price
            mealCost: mealCost, // Total meal cost
            lunchCost: lunchCost, // Buffet lunch cost
            pmSnackCost: pmSnackCost, // PM snack cost
            pricePerPax: pricePerPax, // Price per person
            adults: parseInt(adults),
            children: parseInt(children),
            totalGuests: totalGuests,
            maxGuests: room.max_guests,
            extraGuests: room.extra_guests,
            minGuests: room.min_guests || 1,
            maxGuestsRange: room.max_guests_range || room.max_guests,
            roomType: 'day_tour', // Mark as day tour for backend processing
            dayTourDate: format(selectedDate, 'yyyy-MM-dd'), // Store the selected date
            includeLunch: includeLunch,
            includePmSnack: includePmSnack || (availability?.pm_snack_policy === 'required')
        };
        
        console.log('DayTour - Adding item to cart:', cartItem);
        addItem(cartItem);
    };


    // Fetch all Day Tour rooms on component mount
    useEffect(() => {
        fetchAllDayTourRooms();
    }, []);

    // Restore selected date from cart state when component mounts
    useEffect(() => {
        if (cartState.dayTourDate && !selectedDate) {
            const date = new Date(cartState.dayTourDate);
            setSelectedDate(date);
            fetchAvailability(date);
            fetchCurrentPricing(date);
        }
    }, [cartState.dayTourDate, selectedDate]);

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO
                title="Day Tour - Laiya Beach Resort"
                description="Experience our Day Tour packages at Laiya Beach Resort. Enjoy beachfront facilities, optional buffet meals, and recreation activities from 8:00 AM to 5:00 PM."
                canonical={typeof window !== 'undefined' ? window.location.origin + '/day-tour' : 'https://www.netaniadelaiya.com/day-tour'}
                og={{
                    title: 'Day Tour - Laiya Beach Resort',
                    description: 'Experience our Day Tour packages at Laiya Beach Resort. Enjoy beachfront facilities, optional buffet meals, and recreation activities.',
                    url: 'https://www.netaniadelaiya.com/day-tour',
                }}
            />

            <RoomsHero imageUrls={heroImages} title="Day Tour" />
            
            {/* Date Selection Form */}
            <div className="absolute inset-x-0 bottom-1 transform translate-y-8/12 px-4 z-10">
                <div className="w-full md:w-1/2 lg:w-1/3 mx-auto">
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Select Day Tour Date
                                    </label>
                                    <DayTourDatePicker
                                        date={selectedDate}
                                        onChange={handleDateChange}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Day Tour hours: 8:00 AM – 5:00 PM</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <section className="max-w-7xl mx-auto mt-36 px-4 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Rooms and Meals */}
                    <div className="lg:col-span-2 space-y-6">
                        {loading && <Loader />}

                        {error && (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2 text-red-600">Error</h3>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                    <Button onClick={() => fetchAllDayTourRooms()} className="cursor-pointer">
                                        Retry
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* All Day Tour Rooms */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Day Tour Facilities
                                </CardTitle>
                                <div className="text-sm text-gray-600">
                                    {!selectedDate ? (
                                        "Select a date above to see availability and add facilities to your cart"
                                    ) : (
                                        "Available facilities for your selected date"
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {allDayTourRooms.length === 0 && !loading ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600">
                                            No Day Tour facilities are currently available.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                                        {(selectedDate && availability?.rooms ? availability.rooms : allDayTourRooms).map(room => {
                                            // If we have availability data, use it (includes room capacity info)
                                            // Otherwise, use the basic room data
                                            const roomData = availability?.rooms ? {
                                                ...room,
                                                // Map availability data to room structure
                                                slug: room.room_id,
                                                name: room.name,
                                                max_guests: room.max_guests,
                                                extra_guests: room.extra_guests,
                                                min_guests: room.min_guests,
                                                max_guests_range: room.max_guests_range,
                                                available_units: room.available_units,
                                                room_type: room.room_type
                                                // Note: price_per_pax is NOT room-specific - it comes from currentPricing
                                            } : {
                                                ...room,
                                                available_units: 0 // Show as unavailable if no date selected
                                                // Note: No pricing available without date - will show "Select a date to see pricing"
                                            };

                                            return (
                                                <DayTourRoomCard
                                                    key={roomData.slug || room.slug}
                                                    room={roomData}
                                                    onAddToCart={handleAddToCart}
                                                    selectedDate={selectedDate}
                                                    currentPricing={currentPricing}
                                                    availability={availability}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column - Information */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-6">
                            {/* Information Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Day Tour Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-4 h-4 mt-0.5 text-blue-500" />
                                        <div>
                                            <div className="font-medium">Operating Hours</div>
                                            <div className="text-gray-600">8:00 AM to 5:00 PM daily</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 mt-0.5 text-green-500" />
                                        <div>
                                            <div className="font-medium">Beach Access</div>
                                            <div className="text-gray-600">Full access to resort facilities</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Users className="w-4 h-4 mt-0.5 text-purple-500" />
                                        <div>
                                            <div className="font-medium">Pricing</div>
                                            {currentPricing ? (
                                                <div className="text-gray-600">
                                                    <div className="font-medium text-blue-600 mb-1">
                                                        {currentPricing.name}: {formatCurrency(currentPricing.price_per_pax)}/pax
                                                    </div>
                                                    <div className="text-sm">
                                                        {currentPricing.description || 'Includes entrance, parking, pool & beach access, WiFi, and plated lunch'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-600">Per person pricing - includes entrance, parking, pool & beach access, WiFi, and plated lunch</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cart Status */}
                            {cartState.items.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Your Cart</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center space-y-3">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {cartState.items.length} {cartState.items.length === 1 ? 'Facility' : 'Facilities'}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total: {formatCurrency(cartState.items.reduce((sum, item) => sum + item.price, 0))}
                                            </div>
                                            <Button
                                                onClick={() => navigate('/cart')}
                                                className="w-full cursor-pointer"
                                                size="lg"
                                            >
                                                View Cart & Checkout
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Mixing Prevention Dialog */}
            <DeleteDialog
                open={showMixingDialog}
                onOpenChange={setShowMixingDialog}
                title="Clear Overnight Booking?"
                description="You have overnight rooms in your cart. Day Tour and overnight bookings cannot be mixed. Would you like to clear your cart and continue with Day Tour?"
                onConfirm={() => {
                    clearCart(); // Clear the overnight cart
                    setShowMixingDialog(false);
                    toast.success("Cart cleared. You can now add Day Tour facilities.");
                }}
                confirmText="Clear Cart"
                cancelText="Cancel"
            />

            {/* Add to Cart Dialog */}
            <DayTourAddToCartDialog
                open={showAddToCartDialog}
                onOpenChange={setShowAddToCartDialog}
                room={selectedRoomForDialog}
                currentPricing={currentPricing}
                availability={availability}
                selectedDate={selectedDate}
                onConfirm={handleConfirmAddToCart}
            />

        </div>
    );
}
