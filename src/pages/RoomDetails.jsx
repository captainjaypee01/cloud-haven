import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { roomCommonData } from '../assets/assets'
import { formatCurrency } from '../utils/currency'
import { roomPhotos } from '../data/rooms'
import { useRoom, useAvailability } from '../queries/rooms'
import { useAppContext } from '../context/AppContext'
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import * as lucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from '../context/CartContext'
import { GuestSelector } from '../components/GuestSelector'
import { toast } from "sonner"
import RequireDatesDialog from '@/components/common/RequireDatesDialog'
import SEO from '@/components/SEO'

const iconsModule = lucideIcons.default || lucideIcons;

const RoomDetails = () => {
    const { roomId } = useParams()
    const { navigate } = useAppContext();
    const { addItem, state } = useCart();
    const { data: room, isLoading, isError, error, status } = useRoom(roomId);
    const { control, handleSubmit } = useForm({
        defaultValues: { dateRange: { from: null, to: null }, accommodations: 1, adults: "1", children: "0" },
    });

    const [mainImage, setMainImage] = useState(roomPhotos[0])
    const [requireDatesOpen, setRequireDatesOpen] = useState(false);

    // If no dates selected (direct navigation), prompt user to select
    useEffect(() => {
        if (!state?.checkIn || !state?.checkOut) {
            setRequireDatesOpen(true);
        }
    }, [state?.checkIn, state?.checkOut]);

    // Check availability for selected dates
    const { data: availabilityData } = useAvailability({
        check_in: state?.checkIn,
        check_out: state?.checkOut,
        room_slug: roomId,
    });

    const availableCount = useMemo(() => {
        const data = availabilityData;
        if (!data) return undefined;
        // Support different shapes defensively
        if (Array.isArray(data)) {
            const item = data.find((it) => it.room_slug === roomId || it.roomId === roomId || it.slug === roomId);
            if (!item) return undefined;
            return item.available_count ?? (item.available ? 1 : 0);
        }
        if (typeof data === 'object') {
            if (data.available_count != null) return data.available_count;
            if (data.data) {
                const inner = data.data;
                if (Array.isArray(inner)) {
                    const item = inner.find((it) => it.room_slug === roomId || it.roomId === roomId || it.slug === roomId);
                    return item ? (item.available_count ?? (item.available ? 1 : 0)) : undefined;
                }
                if (typeof inner === 'object' && inner.available_count != null) return inner.available_count;
            }
            if (data.available != null) return data.available ? 1 : 0;
        }
        return undefined;
    }, [availabilityData, roomId]);

    const isUnavailable = (availableCount !== undefined && availableCount <= 0);

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
        const bookRoomData = { ...data, roomId: roomId }
        const { adults, children } = data;

        const totalGuests = parseInt(adults) + parseInt(children);

        if (totalGuests > parseInt(room.max_guests) + parseInt(room.extra_guests)) {

            toast.error(`Only up to ${room.max_guests + room.extra_guests} guests can stay in this room.`);
            return
        }
        if (totalGuests > room.max_guests) {
            toast.warning(
                `Max ${room.max_guests} guests allowed (you have ${totalGuests}). We only allow for ${room.extra_guests} extra guest/s`
            );
        };
        if (!state?.checkIn || !state?.checkOut) {
            toast.error('Please select dates first.');
            setRequireDatesOpen(true);
            return;
        }
        if (isUnavailable) {
            toast.error('This room is not available for your selected dates.');
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
                    title: room.name,
                    description: room.short_description || room.description,
                    image: mainImage,
                    type: 'product',
                    url: typeof window !== 'undefined' ? `${window.location.origin}/rooms/${room.slug || roomId}` : `https://www.netaniadelaiya.com/rooms/${room.slug || roomId}`
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
                            address: {
                                '@type': 'PostalAddress',
                                streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
                                addressLocality: 'San Juan',
                                addressRegion: 'Batangas',
                                addressCountry: 'PH'
                            }
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
                    </div>
                </div>
            )}

            {/* Room Price */}
            <div className='flex items-center gap-1 mt-2'>
                <p className='text-lg font-bold'>{formatCurrency(room.price)} /night</p>
            </div>

            {/* Max guests */}
            <div className='flex items-center gap-1 mt-2'>
                <p className=''>Max Guest: <span className='font-inter text-sm'>({room.max_guests})</span></p>
            </div>
            {/* Room Rating */}
            {/* <div className='flex items-center gap-1 mt-2'>
                <StarRating />
                <p className='ml-2'>200+ reviews</p>
            </div> */}

            {/* Room Short Description */}
            <div className='flex-items-center gap-1 text-gray-500 mt-2'>
                <span>{room.description}</span>
            </div>

            {/* Room Short Description */}
            <div className='flex flex-col lg:flex-row mt-6 gap-6'>
                <div className='lg:w-1/2 w-full'>
                    <img src={mainImage} alt="Room Image" className='w-full rounded-xl shadow-lg object-cover' />
                </div>
                <div className='grid grid-cols-2 gap-4 lg:w-1/2 w-full'>
                    {roomPhotos.length > 1 && roomPhotos.map((image, index) => (
                        <img onClick={() => setMainImage(image)} key={index} src={image} alt="Room Image" className={`w-full h-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image && 'outline-3 outline-orange-500'}`} />
                    ))}
                </div>
            </div>

            {/* Room Highlights */}
            <div className='flex flex-col md:flex-row md:justify-between mt-10'>
                <div>
                    <h1 className='text-3xl md:text-4xl font-playfair'>{room?.short_description}</h1>
                    <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
                        {room?.amenities && room?.amenities.map((item, index) => {

                            const Icon = iconsModule[item.icon] || iconsModule.HelpCircle;
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

            <div className='flex flex-col md:flex-row items-center md:items-center justify-between p-6 rounded-xl mx-auto mt-16 max-w-1xl md:max-w-2xl'>
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
                bg-white p-6 rounded-lg shadow-lg max-w-full
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
                        <label className="text-sm font-medium block mb-1">Children</label>
                        <Controller
                            name="children"
                            control={control}
                            render={({ field }) => (
                                <GuestSelector
                                    className="w-full justify-between text-left"
                                    maxGuests={room.max_guests + room.extra_guests}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-3 lg:col-span-3 w-full">
                        {isUnavailable ? (
                            <div className="flex gap-2 w-full">
                                <Button type="button" variant="outline" className="w-full cursor-pointer" onClick={() => setRequireDatesOpen(true)}>
                                    Change dates
                                </Button>
                            </div>
                        ) : (
                            <Button type="submit" size="lg" className="w-full cursor-pointer">
                                Book this room
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
        </div>
    )
}

export default RoomDetails