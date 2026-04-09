import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { roomCommonData } from '../assets/assets'
import { formatCurrency } from '../utils/currency'
import { roomPhotos } from '../data/rooms'
import { useRoom } from '../queries/rooms'
import { useRoomAvailability } from '../hooks/useRoomAvailability'
import { RoomAvailabilityBadge } from '../components/common/RoomAvailabilityBadge'
import { RoomGallerySlider } from '../components/common/RoomGallerySlider'
import { getOptimizedImageUrl } from '../utils/imageOptimization'
import { useAppContext } from '../context/AppContext'
import { Skeleton } from "@/components/ui/skeleton";
import { 
    AlertCircleIcon, 
    Calendar, 
    Search, 
    ShoppingCart, 
    CheckCircle, 
    Loader2, 
    Users, 
    UserPlus, 
    Plus,
    HelpCircle
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from '../context/CartContext'
import { GuestSelector } from '../components/GuestSelector'
import { toast } from "sonner"
import RequireDatesDialog from '@/components/common/RequireDatesDialog'
import SEO from '@/components/SEO'
import SocialShare from '@/components/SocialShare'
import { validateRoomTypeMixing, isDayTourRoom } from "@/utils/roomTypeUtils";
import DeleteDialog from "@/components/common/form/DeleteDialog";

const RoomDetails = () => {
    const { roomId } = useParams()
    const { navigate } = useAppContext();
    const { addItem, state, clear, clearItemsOnly } = useCart();
    const { data: room, isLoading, isError, error, status } = useRoom(roomId);
    const { control, handleSubmit, watch } = useForm({
        defaultValues: { dateRange: { from: null, to: null }, accommodations: 1, adults: "1", children: "0" },
    });

    const mainImage = room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || roomPhotos[0];
    const optimizedMainImage = mainImage ? getOptimizedImageUrl(mainImage, {
        width: 'w_800',
        height: 'h_auto',
        quality: 'auto',
        format: 'auto'
    }) : roomPhotos[0];
    const [requireDatesOpen, setRequireDatesOpen] = useState(false);
    const [showMixingDialog, setShowMixingDialog] = useState(false);

    // If no dates selected (direct navigation), prompt user to select
    useEffect(() => {
        if (!state?.checkIn || !state?.checkOut) {
            setRequireDatesOpen(true);
        }
    }, [state?.checkIn, state?.checkOut]);

    // Check availability for selected dates using new hook with debouncing
    const {
        availableUnits,
        isLoading: availabilityLoading,
        isError: availabilityError,
        isDebouncing,
        isUnavailable,
        pending,
        confirmed,
        maintenance,
        totalUnits,
    } = useRoomAvailability(roomId, state?.checkIn, state?.checkOut);

    // Calculate remaining availability considering cart items
    const roomsInCart = state.items.filter(item => item.roomId === room?.slug).length;
    const remainingUnits = availableUnits !== undefined ? Math.max(0, availableUnits - roomsInCart) : undefined;
    const isCartFull = availableUnits !== undefined && roomsInCart >= availableUnits;

    // Watch form values for real-time guest validation
    const watchedAdults = watch("adults");
    const watchedChildren = watch("children");
    const totalGuests = parseInt(watchedAdults || "0") + parseInt(watchedChildren || "0");

    // Guest validation logic
    const exceedsCapacity = room && totalGuests > (parseInt(room.max_guests) + parseInt(room.extra_guests));
    const exceedsMaxGuests = room && totalGuests > parseInt(room.max_guests);
    const hasNoGuests = totalGuests === 0;

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

    // ❷ Show error
    if (isError) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-lg py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
                <AlertCircleIcon className="h-8 w-8 text-red-500" />
                <p className="text-red-600 text-lg font-medium">
                    {error.message}
                </p>
                <button
                    onClick={() => navigate('/rooms')}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                >
                    Go back to Accommodations
                </button>
            </div>
        );
    }

    const handleAddRoom = (data) => {
        // const bookRoomData = { ...data, roomId: roomId }
        const { adults, children } = data;

        const totalGuests = parseInt(adults) + parseInt(children);

        // Guest validation with improved messaging
        if (totalGuests === 0) {
            toast.error('Please select at least 1 guest.');
            return;
        }

        if (totalGuests > parseInt(room.max_guests) + parseInt(room.extra_guests)) {
            toast.error(`Only up to ${room.max_guests + room.extra_guests} guests can stay in this room.`);
            return;
        }
        
        if (totalGuests > room.max_guests) {
            toast.warning(
                `Max ${room.max_guests} guests allowed (you have ${totalGuests}). We allow for ${room.extra_guests} extra guest/s.`
            );
        }
        if (!state?.checkIn || !state?.checkOut) {
            toast.error('Please select dates first.');
            setRequireDatesOpen(true);
            return;
        }
        if (isUnavailable) {
            toast.error('This room is not available for your selected dates.');
            return;
        }

        // Check for room type mixing
        const mixingValidation = validateRoomTypeMixing(state.items, room);
        if (!mixingValidation.isValid) {
            // Show mixing dialog for both cases - consistent behavior
            setShowMixingDialog(true);
            return;
        }

        // Check availability limits before adding to cart
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

        addItem({
            roomId: room.slug,
            name: room.name,
            price: room.price, // unit price from service/API
            adults: parseInt(adults), // number of adults
            children: parseInt(children), // number of children
            maxGuests: room.max_guests, // number of max guest in the room
            extraGuests: room.extra_guests, // number of allowed extra guest
        })
    }

    return room && (
        <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>
            <SEO
                title={`${room.name} in Laiya, Batangas`}
                description={room.short_description || room.description}
                canonical={typeof window !== 'undefined' ? `${window.location.origin}/rooms/${room.slug || roomId}` : undefined}
                og={{
                    title: `${room.name} | Netania De Laiya`,
                    description: room.short_description || room.description,
                    image: room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || roomPhotos[0],
                    type: 'product',
                    url: typeof window !== 'undefined' ? `${window.location.origin}/rooms/${room.slug || roomId}` : `https://www.netaniadelaiya.com/rooms/${room.slug || roomId}`,
                    locale: 'en_PH',
                    siteName: 'Netania De Laiya'
                }}
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.netaniadelaiya.com/' },
                            { '@type': 'ListItem', position: 2, name: 'Rooms', item: 'https://www.netaniadelaiya.com/rooms' },
                            { '@type': 'ListItem', position: 3, name: room.name, item: `https://www.netaniadelaiya.com/rooms/${room.slug || roomId}` }
                        ]
                    },
                    {
                        '@context': 'https://schema.org',
                        '@type': 'HotelRoom',
                        name: room.name,
                        description: room.short_description || room.description,
                        image: mainImage,
                        url: `https://www.netaniadelaiya.com/rooms/${room.slug || roomId}`,
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'PHP',
                            price: room.price,
                            availability: isUnavailable ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'
                        },
                        containedInPlace: {
                            '@type': 'Resort',
                            name: 'Netania De Laiya',
                            telephone: '+63 949 798 9831',
                            address: {
                                '@type': 'PostalAddress',
                                streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
                                addressLocality: 'San Juan',
                                addressRegion: 'Batangas',
                                addressCountry: 'PH'
                            },
                            sameAs: [
                                'https://www.facebook.com/profile.php?id=100064182843841',
                                'https://www.instagram.com/netaniadelaiya/'
                            ]
                        }
                    }
                ]}
            />

            {/* Room Details */}
            <div className='flex flex-col md:flex-row items-start md:items-center gap-2'>
                <h1 className='text-3xl md:text-4xl font-playfair'>{room.name}
                    {/* <span className='font-inter text-sm'>({room.roomType})</span> */}
                </h1>
                {/* <p className='text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full'>20% OFF</p> */}
            </div>

            {/* Availability notice */}
            {state?.checkIn && state?.checkOut && isUnavailable && (
                <div className="mt-4 mb-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                    <AlertCircleIcon className="mt-0.5 h-5 w-5 text-red-500" />
                    <div>
                        <p className="font-medium">Not available for your selected dates</p>
                        <p className="text-sm">Please adjust your dates to book this room. Featured rooms are shown even when unavailable.</p>
                        {pending > 0 && (
                            <div className="mt-2 text-sm">
                                <p className="text-amber-700">
                                    <strong>{pending}</strong> unit(s) are currently pending and may become available.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pending notice */}
            {state?.checkIn && state?.checkOut && !isUnavailable && pending > 0 && (
                <div className="mt-4 mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700">
                    <AlertCircleIcon className="mt-0.5 h-5 w-5 text-amber-500" />
                    <div>
                        <p className="font-medium">Limited availability</p>
                        <p className="text-sm">
                            {availableUnits} unit(s) available, {pending} unit(s) pending.
                        </p>
                    </div>
                </div>
            )}

            {/* Cart status notice */}
            {state?.checkIn && state?.checkOut && roomsInCart > 0 && !isUnavailable && (
                <div className="mt-4 mb-2 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-700">
                    <AlertCircleIcon className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div>
                        <p className="font-medium">
                            {roomsInCart} {room.name} {roomsInCart === 1 ? 'room' : 'rooms'} in your cart
                        </p>
                        <p className="text-sm">
                            {isCartFull ? 
                                'You have reached the maximum available rooms for these dates.' :
                                `You can add ${remainingUnits} more room${remainingUnits === 1 ? '' : 's'} to your booking.`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Room Price */}
            <div className='flex items-center gap-1 mt-2'>
                <p className='text-lg font-bold'>{formatCurrency(room.price)} /night</p>
            </div>

            {/* Share */}
            <div className='mt-2'>
                <SocialShare
                    url={typeof window !== 'undefined' ? window.location.href : `https://www.netaniadelaiya.com/rooms/${room.slug || roomId}`}
                    title={`${room.name} | Netania De Laiya`}
                    description={room.short_description || room.description}
                    image={room?.images?.[0]?.secure_image_url || room?.images?.[0]?.url || roomPhotos[0]}
                />
            </div>

            {/* Max guests */}
            <div className='flex items-center gap-1 mt-2'>
                <p className=''>Max Guest: <span className='font-inter text-sm'>({room.max_guests})</span></p>
            </div>

            {/* Availability Badge */}
            {state?.checkIn && state?.checkOut && (
                <div className='flex items-center gap-2 mt-2'>
                    <span className='text-sm text-gray-600'>Availability:</span>
                    <RoomAvailabilityBadge
                        availableUnits={remainingUnits}
                        pending={pending}
                        isLoading={availabilityLoading}
                        isError={availabilityError}
                        isDebouncing={isDebouncing}
                        size="default"
                    />
                    {roomsInCart > 0 && availableUnits !== undefined && (
                        <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded'>
                            {roomsInCart} in cart
                        </span>
                    )}
                </div>
            )}
            {/* Room Rating */}
            {/* <div className='flex items-center gap-1 mt-2'>
                <StarRating />
                <p className='ml-2'>200+ reviews</p>
            </div> */}

            {/* Room Short Description */}
            <div className='flex-items-center gap-1 text-gray-500 mt-2'>
                <span>{room.description}</span>
            </div>

            {/* Room Gallery Slider */}
            <div className='mt-6'>
                <RoomGallerySlider
                    images={room?.images?.length > 0 ? room.images.map(img => img.secure_image_url || img.url) : roomPhotos}
                    roomName={room.name}
                    className="w-full max-w-4xl mx-auto"
                    aspectRatio={16/9}
                    showThumbnails={true}
                    loop={true}
                />
            </div>

            {/* Room Highlights */}
            <div className='flex flex-col md:flex-row md:justify-between mt-10'>
                <div>
                    <h1 className='text-3xl md:text-4xl font-playfair'>{room?.short_description}</h1>
                    <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
                        {room?.amenities && room?.amenities.map((item, index) => {
                            // Dynamic icon import - fallback to HelpCircle if icon not found
                            let Icon = HelpCircle;
                            try {
                                // Try to dynamically import the icon if it exists
                                if (item.icon && typeof item.icon === 'string') {
                                    const iconName = item.icon.charAt(0).toUpperCase() + item.icon.slice(1);
                                    // For now, we'll use HelpCircle as fallback since we don't know all possible icons
                                    // In a real app, you'd want to import all possible amenity icons
                                    Icon = HelpCircle;
                                }
                            } catch (error) {
                                Icon = HelpCircle;
                            }
                            return (
                                <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100'>

                                    <Badge key={index} variant="secondary" className="text-sm">
                                        <Icon className="w-5 h-5" />
                                        {/* <img src={facilityIcons[am?.name]} alt={am?.name} className='w-5 h-5' /> */}
                                        {item.name}
                                    </Badge>
                                    {/* <img src={facilityIcons[item?.name]} alt={item?.name} className='w-5 h-5' />
                                <p className="text-xs">{item?.name}</p> */}
                                </div>
                            )
                        }
                        )}
                    </div>
                </div>
            </div>

            <div className='flex flex-col md:flex-row items-center md:items-center justify-between p-6 rounded-xl mx-auto mt-16 w-full max-w-none md:max-w-2xl'>
                {/* <SearchForm /> */}
                <form
                    onSubmit={handleSubmit(handleAddRoom)}
                    className="
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-2
                xl:grid-cols-2
                gap-4
                items-end
                bg-white p-6 rounded-lg shadow-lg w-full
            "
                >

                    <div className="col-span-1">
                        <label className="text-sm font-medium block mb-1">Adults</label>
                        <Controller
                            name="adults"
                            control={control}
                            render={({ field }) => (

                                <GuestSelector
                                    maxGuests={room.max_guests + room.extra_guests}
                                    {...field}
                                />
                                // <Input type="number" min={1} {...field} className="w-full" />
                            )}
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="text-sm font-medium block mb-1">Children (4-6 years old)</label>
                        <Controller
                            name="children"
                            control={control}
                            render={({ field }) => (
                                <GuestSelector
                                    className="w-full justify-between text-left"
                                    maxGuests={room.max_guests + room.extra_guests}
                                    showChildPolicy={true}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div className="col-span-2 text-sm text-gray-600">
                        <span>3 years old and below are free of charge.</span>
                    </div>
                    {/* Guest count feedback - similar to QuickBookingDialog */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-3 w-full space-y-2">
                        <div className="text-sm text-gray-600">
                            Total guests: <span className={`font-medium ${exceedsCapacity ? 'text-red-600' : 'text-gray-900'}`}>
                                {totalGuests}
                            </span>
                        </div>
                        
                        {exceedsCapacity && (
                            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                                <AlertCircleIcon className="mt-0.5 h-5 w-5 text-red-500" />
                                <div>
                                    <p className="font-medium">Exceeds maximum capacity</p>
                                    <p className="text-sm">Maximum {room.max_guests + room.extra_guests} guests allowed for this room.</p>
                                </div>
                            </div>
                        )}
                        
                        {exceedsMaxGuests && !exceedsCapacity && (
                            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-700">
                                <AlertCircleIcon className="mt-0.5 h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="text-sm">You have {totalGuests} guests (over {room.max_guests} standard capacity).</p>
                                </div>
                            </div>
                        )}

                        {hasNoGuests && (
                            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                                <AlertCircleIcon className="mt-0.5 h-5 w-5 text-red-500" />
                                <div>
                                    <p className="font-medium">Please select guests</p>
                                    <p className="text-sm">At least 1 guest is required to make a booking.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 md:col-span-3 lg:col-span-3 w-full">
                        {isUnavailable ? (
                            <div className="space-y-4">
                                {/* Unavailable state with better visual hierarchy */}
                                <div className="text-center space-y-3">
                                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                                        <AlertCircleIcon className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Room Not Available</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            This room is not available for your selected dates. Try selecting different dates to check availability.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Action buttons with better mobile layout */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button 
                                        type="button" 
                                        size="lg"
                                        className="w-full sm:flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white" 
                                        onClick={() => setRequireDatesOpen(true)}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Change Dates
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="lg"
                                        className="w-full sm:flex-1 cursor-pointer" 
                                        onClick={() => navigate('/rooms')}
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        Browse Other Rooms
                                    </Button>
                                </div>
                            </div>
                        ) : isCartFull ? (
                            <div className="space-y-4">
                                {/* Cart full state with better visual hierarchy */}
                                <div className="text-center space-y-3">
                                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Maximum Rooms Added</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            You've added all available rooms for these dates to your cart.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Action buttons with better mobile layout */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        disabled 
                                        size="lg"
                                        className="w-full sm:flex-1 cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Maximum Added
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="lg"
                                        className="w-full sm:flex-1 cursor-pointer" 
                                        onClick={() => setRequireDatesOpen(true)}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Change Dates
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button 
                                type="submit" 
                                size="lg" 
                                className="w-full cursor-pointer"
                                disabled={
                                    availabilityLoading || 
                                    isDebouncing || 
                                    exceedsCapacity || 
                                    hasNoGuests
                                }
                            >
                                {availabilityLoading || isDebouncing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Checking availability...
                                    </>
                                ) : exceedsCapacity ? (
                                    <>
                                        <Users className="w-4 h-4 mr-2" />
                                        Exceeds room capacity
                                    </>
                                ) : hasNoGuests ? (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Select guests
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Book this room
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Common Specifications */}
            <div className='mt-25 space-y-4'>
                {roomCommonData.map((spec, index) => (
                    <div key={index} className='flex items-start gap-2'>
                        <img src={spec.icon} alt={`${spec.title}-icon`} className='w-6.5' />
                        <div>
                            <p className="text-base">{spec.title}</p>
                            <p className="text-gray-500">{spec.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500">
                <p>{room.long_description}</p>
            </div>

            <RequireDatesDialog open={requireDatesOpen} onOpenChange={setRequireDatesOpen} />
            
            {/* Mixing Prevention Dialog */}
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
                    clearItemsOnly(); // Clear only items but preserve dates
                    setShowMixingDialog(false);
                    if (isDayTourRoom(room)) {
                        // Navigate to Day Tour page if this is a Day Tour room
                        toast.success("Cart cleared. Redirecting to Day Tour booking page...");
                        setTimeout(() => navigate('/day-tour'), 1000);
                    } else {
                        // Stay on current page for overnight rooms
                        toast.success("Cart cleared. You can now add this overnight room.");
                    }
                }}
                confirmText="Clear Cart"
                cancelText="Cancel"
            />
        </div>
    )
}

export default RoomDetails