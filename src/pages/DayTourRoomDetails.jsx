import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import { umbrellaRoomPhotos, cabanaRoomPhotos } from '@/data/rooms';
import { useRoom } from '@/queries/rooms';
import { RoomAvailabilityBadge } from '@/components/common/RoomAvailabilityBadge';
import { RoomGallerySlider } from '@/components/common/RoomGallerySlider';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon, Clock, Users, MapPin } from 'lucide-react';
import * as lucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from '@/context/CartContext';
import { toast } from "sonner";
import RequireDatesDialog from '@/components/common/RequireDatesDialog';
import SEO from '@/components/SEO';
import SocialShare from '@/components/SocialShare';
import { DayTourAddToCartDialog } from '@/components/dayTour/DayTourAddToCartDialog';
import { useApi } from '@/hooks/useApi';
import { fetchDayTourAvailability, fetchCurrentDayTourPricing } from '@/services/dayTour';

const iconsModule = lucideIcons;

const DayTourRoomDetails = () => {
    const { roomId } = useParams();
    const { navigate } = useAppContext();
    const { state: cartState, addItem, setDayTourDate } = useCart();
    const api = useApi();

    const { data: room, isLoading, isError, error: roomError, status } = useRoom(roomId);

    // State for Day Tour specific data
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentPricing, setCurrentPricing] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Dialog states
    const [requireDatesOpen, setRequireDatesOpen] = useState(false);
    const [showAddToCartDialog, setShowAddToCartDialog] = useState(false);

    // Get photos for this room (use room images if available, otherwise use random room photos)
    const photos = room?.images?.length ?
        room.images.map(img => img.secure_image_url || img.url) :
        (room?.name?.toLowerCase().includes('cabana') ? cabanaRoomPhotos.sort(() => Math.random() - 0.5) : umbrellaRoomPhotos.sort(() => Math.random() - 0.5));

    const mainImage = room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || photos[0];

    // Check if this is a Day Tour room
    const isDayTourRoom = room?.room_type === 'day_tour';

    // If no Day Tour date selected (direct navigation), prompt user to select
    useEffect(() => {
        if (!cartState?.dayTourDate) {
            setRequireDatesOpen(true);
        } else {
            setSelectedDate(cartState.dayTourDate);
        }
    }, [cartState?.dayTourDate]);

    // Fetch Day Tour data when date is selected
    useEffect(() => {
        if (selectedDate && isDayTourRoom) {
            fetchDayTourData(selectedDate);
        }
    }, [selectedDate, isDayTourRoom]);

    const fetchDayTourData = async (date) => {
        setLoading(true);
        setError(null);

        try {
            // Fetch both pricing and availability data
            const [pricingData, availabilityData] = await Promise.all([
                fetchCurrentDayTourPricing(api, date),
                fetchDayTourAvailability(api, date)
            ]);

            setCurrentPricing(pricingData);
            setAvailability(availabilityData);
        } catch (err) {
            console.error('Failed to fetch Day Tour data:', err);
            setError('Failed to load Day Tour information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setDayTourDate(date);
        setRequireDatesOpen(false);
    };

    const handleBookNow = () => {
        if (!selectedDate) {
            setRequireDatesOpen(true);
            return;
        }

        if (!currentPricing) {
            toast.error('Pricing information is not available for the selected date.');
            return;
        }

        setShowAddToCartDialog(true);
    };

    const handleAddToCart = (room, adults, children, includeLunch, includePmSnack) => {
        const totalGuests = adults + children;
        const pricePerPax = currentPricing?.price_per_pax || 0;
        const basePrice = pricePerPax * totalGuests;

        let lunchCost = 0;
        let pmSnackCost = 0;

        if (includeLunch && availability?.buffet_active && availability?.lunch_prices) {
            lunchCost = (adults * availability.lunch_prices.adult) + (children * availability.lunch_prices.child);
        }

        if (includePmSnack && availability?.pm_snack_prices) {
            pmSnackCost = (adults * availability.pm_snack_prices.adult) + (children * availability.pm_snack_prices.child);
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
            dayTourDate: selectedDate,
            includeLunch: includeLunch,
            includePmSnack: includePmSnack || (availability?.pm_snack_policy === 'required')
        };

        addItem(cartItem);
        setShowAddToCartDialog(false);
    };

    // Get room availability data for the selected date
    const getRoomAvailability = () => {
        if (!availability?.rooms || !room) return null;
        return availability.rooms.find(r => r.room_id === room.slug);
    };

    const roomAvailability = getRoomAvailability();

    if (isLoading) {
        return (
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (isError || !room) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-lg">
                <AlertCircleIcon className="h-8 w-8 text-red-500" />
                <p className="text-red-600 text-lg font-medium">
                    {status === 500
                        ? "Something went wrong, please contact the administrator"
                        : "Room not found"}
                </p>
                <Button onClick={() => navigate('/day-tour')} variant="outline">
                    Back to Day Tour
                </Button>
            </div>
        );
    }

    // Redirect to regular room details if this is not a Day Tour room
    if (!isDayTourRoom) {
        navigate(`/rooms/${room.slug}`);
        return null;
    }

    return (
        <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>
            <SEO
                title={`${room.name} Day Tour | Netania De Laiya`}
                description={`Book ${room.name} Day Tour facility at Netania De Laiya beachfront resort in Laiya, San Juan, Batangas. ${room.short_description || room.description} Capacity: ${room.min_guests || 1}-${room.max_guests_range || room.max_guests} guests. Includes pool & beach access, WiFi, parking. Optional buffet lunch available. Reserve now!`}
                keywords={`${room.name} day tour, day tour facility Laiya, ${room.name} Batangas, beachfront day tour facility, day tour room ${room.name}, Laiya day tour booking, San Juan Batangas day tour`}
                canonical={typeof window !== 'undefined' ? `${window.location.origin}/day-tour/${room.slug}` : undefined}
                og={{
                    title: `${room.name} Day Tour | Netania De Laiya`,
                    description: `Book ${room.name} Day Tour facility at Netania De Laiya. ${room.short_description || room.description} Capacity: ${room.min_guests || 1}-${room.max_guests_range || room.max_guests} guests.`,
                    image: room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || photos[0],
                    type: 'product',
                    url: typeof window !== 'undefined' ? `${window.location.origin}/day-tour/${room.slug}` : `https://www.netaniadelaiya.com/day-tour/${room.slug}`
                }}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: `${room.name} - Day Tour Facility`,
                        description: room.long_description || room.short_description || room.description,
                        image: room?.images?.map(img => img.secure_image_url || img.url) || photos,
                        brand: {
                            '@type': 'Brand',
                            name: 'Netania De Laiya'
                        },
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'PHP',
                            availability: 'https://schema.org/InStock',
                            url: typeof window !== 'undefined' ? `${window.location.origin}/day-tour/${room.slug}` : `https://www.netaniadelaiya.com/day-tour/${room.slug}`
                        },
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '4.5',
                            reviewCount: '50',
                            bestRating: '5',
                            worstRating: '1'
                        }
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.netaniadelaiya.com/' },
                            { '@type': 'ListItem', position: 2, name: 'Day Tour', item: 'https://www.netaniadelaiya.com/day-tour' },
                            { '@type': 'ListItem', position: 3, name: room.name, item: `https://www.netaniadelaiya.com/day-tour/${room.slug}` }
                        ]
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'TouristAttraction',
                        name: `${room.name} Day Tour Facility`,
                        description: room.long_description || room.short_description || room.description,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
                            addressLocality: 'San Juan',
                            addressRegion: 'Batangas',
                            addressCountry: 'PH'
                        },
                        image: room?.images?.map(img => img.secure_image_url || img.url) || photos,
                        openingHours: 'Mo-Su 08:00-17:00',
                        publicAccess: true
                    }
                ]}
            />

            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/day-tour')} className="p-0 h-auto">
                        Day Tour
                    </Button>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{room.name}</span>
                </div>

                {/* Room Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{room.name}</h1>
                            <p className="text-lg text-gray-600 mb-4">{room.short_description}</p>

                            {/* Room Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>Up to {room.max_guests} guests</span>
                                    {room.extra_guests > 0 && (
                                        <span className="text-xs">
                                            (+{room.extra_guests} extra)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>8:00 AM – 5:00 PM</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>Laiya, Batangas</span>
                                </div>
                            </div>

                            {/* Room Capacity Range */}
                            <div className="text-sm text-gray-600 mb-4">
                                <span className="font-medium">Capacity:</span> {room.min_guests || 1} - {room.max_guests_range || room.max_guests} guests
                            </div>
                        </div>

                        {/* Pricing and Availability */}
                        <div className="lg:w-80">
                            <div className="bg-white rounded-xl shadow-lg p-6 border">
                                <div className="text-center mb-4">
                                    {selectedDate ? (
                                        <>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {currentPricing ? formatCurrency(currentPricing.price_per_pax) : '—'}
                                                <span className="text-sm text-gray-500 font-normal">/pax</span>
                                            </div>
                                            <div className="text-sm text-blue-600">
                                                {currentPricing?.name || 'Standard Rate'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {selectedDate}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-gray-400">
                                                Select Date
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                to see pricing
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Availability Badge */}
                                {selectedDate && roomAvailability && (
                                    <div className="mb-4 flex justify-center">
                                        <RoomAvailabilityBadge
                                            availableUnits={roomAvailability.available_units}
                                            pending={roomAvailability.pending || 0}
                                            isLoading={loading}
                                            isError={!!error}
                                            isDebouncing={false}
                                            size="default"
                                        />
                                    </div>
                                )}

                                {/* Book Now Button */}
                                <Button
                                    onClick={handleBookNow}
                                    className="w-full"
                                    disabled={!selectedDate || !currentPricing || (roomAvailability && roomAvailability.available_units === 0)}
                                >
                                    {!selectedDate ? 'Select Date First' :
                                        !currentPricing ? 'No Pricing Available' :
                                            roomAvailability && roomAvailability.available_units === 0 ? 'Not Available' :
                                                'Book This Room'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Room Gallery */}
                <div className="mb-8">
                    <RoomGallerySlider
                        images={room?.images?.length > 0 ? room.images.map(img => img.secure_image_url || img.url) : photos}
                        roomName={room.name}
                        className="w-full max-w-4xl mx-auto"
                        aspectRatio={16 / 9}
                        showThumbnails={true}
                        loop={true}
                    />
                </div>

                {/* Room Description */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Room</h2>
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed">{room.long_description}</p>
                    </div>
                </div>

                {/* Amenities */}
                {room?.amenities && room.amenities.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {room.amenities.map((amenity, index) => {
                                const Icon = iconsModule[amenity.icon] || iconsModule.HelpCircle;
                                return (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Social Share */}
                <div className="mb-8">
                    <SocialShare
                        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.netaniadelaiya.com'}/day-tour/${room.slug}`}
                        title={`${room.name} - Day Tour in Laiya, Batangas`}
                        description={room.short_description || room.description}
                        image={room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || photos[0]}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <RequireDatesDialog
                open={requireDatesOpen}
                onOpenChange={setRequireDatesOpen}
                onDateSelect={handleDateSelect}
                isDayTour={true}
                title="Select Day Tour Date"
                description="Please select a date for your Day Tour to see pricing and availability."
            />

            <DayTourAddToCartDialog
                open={showAddToCartDialog}
                onOpenChange={setShowAddToCartDialog}
                room={room}
                currentPricing={currentPricing}
                availability={availability}
                selectedDate={selectedDate}
                onConfirm={handleAddToCart}
            />

        </div>
    );
};

export default DayTourRoomDetails;
