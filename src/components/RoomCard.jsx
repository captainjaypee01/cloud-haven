import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
// import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { roomPhotos } from "@/data/rooms";
import { formatCurrency } from "../utils/currency";
import { useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import RequireDatesDialog from "@/components/common/RequireDatesDialog";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { RoomAvailabilityBadge } from "@/components/common/RoomAvailabilityBadge";
import { QuickBookingDialog } from "@/components/common/QuickBookingDialog";

export default function RoomCard({ room }) {
    const photos = roomPhotos.sort(() => Math.random() - 0.5);
    const { state } = useCart();
    const [showDatesDialog, setShowDatesDialog] = useState(false);
    const [showBookingDialog, setShowBookingDialog] = useState(false);

    // Get availability data for this room
    const {
        availableUnits,
        isLoading: availabilityLoading,
        isError: availabilityError,
        isDebouncing,
        isUnavailable,
    } = useRoomAvailability(room.slug, state.checkIn, state.checkOut);

    const handleViewDetailsClick = useCallback((e) => {
        if (!state.checkIn || !state.checkOut) {
            e.preventDefault();
            setShowDatesDialog(true);
        }
    }, [state.checkIn, state.checkOut]);

    const handleBookNow = useCallback((e) => {
        e.preventDefault();
        
        // Check if dates are selected first
        if (!state?.checkIn || !state?.checkOut) {
            setShowDatesDialog(true);
            return;
        }

        // Open the booking dialog to let user specify guest numbers
        setShowBookingDialog(true);
    }, [state.checkIn, state.checkOut]);

    return (
        <article className="w-full">
            <Card className="overflow-hidden shadow-lg py-0">
                <Carousel

                    opts={{ loop: true, align: "center" }}
                    className="w-full h-64">
                    <CarouselContent>
                        {photos.map((src, i) => (
                            <CarouselItem key={i} className="h-64">
                                <img
                                    src={src}
                                    alt={`${room.name} photo ${i + 1}`}
                                    className="w-full h-64 object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                </Carousel>

                <CardHeader>
                    <CardTitle className="text-2xl">{room.name}</CardTitle>
                    <CardDescription>
                        {room.short_description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-6">
                    <p className="text-gray-700">{room.description}</p>
                    <ul className="flex flex-wrap gap-2 text-sm text-sky-700">
                        {room.amenities.map((a, _index) => (
                            <li key={_index} className="after:content-[','] last:after:content-['']">
                                {a?.name}
                            </li>
                        ))}
                    </ul>
                    
                    {/* Availability Badge */}
                    {state.checkIn && state.checkOut && (
                        <div className="flex justify-start">
                            <RoomAvailabilityBadge
                                availableUnits={availableUnits}
                                isLoading={availabilityLoading}
                                isError={availabilityError}
                                isDebouncing={isDebouncing}
                                size="sm"
                            />
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">{formatCurrency(room.price)}/night <p className="text-sm text-gray-600 mt-0.5">Max {room.max_guests} guests</p></span>

                        <div className="flex gap-2">
                            <Link to={`/rooms/${room.slug}`} onClick={handleViewDetailsClick} key={room.slug}>
                                <Button size="sm" variant="outline" className="cursor-pointer">View Details</Button>
                            </Link>
                            {state.checkIn && state.checkOut && (
                                <Button 
                                    size="sm" 
                                    variant={isUnavailable ? "secondary" : "default"}
                                    disabled={isUnavailable || availabilityLoading}
                                    className="cursor-pointer"
                                    onClick={handleBookNow}
                                >
                                    {isUnavailable ? "Sold Out" : "Book Now"}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <RequireDatesDialog
                open={showDatesDialog}
                onOpenChange={setShowDatesDialog}
                targetHref={`/rooms/${room.slug}`}
            />
            <QuickBookingDialog
                open={showBookingDialog}
                onOpenChange={setShowBookingDialog}
                room={room}
                availableUnits={availableUnits}
                isUnavailable={isUnavailable}
                availabilityLoading={availabilityLoading}
            />
        </article>
    );
}


// import React from 'react'
// import { Link } from 'react-router-dom'
// import { assets } from '../assets/assets'
// import { formatCurrency } from '../utils/currency'

// const RoomCard = ({ room, index }) => {
//     return (
//         <Link to={'/rooms/' + room._id} onClick={() => scrollTo(0, 0)} key={room._id}
//             className='relative max-w-70 w-full rounded-xl overflow-hidden bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]'>
//             <img src={room.images[0]} alt="" />
//             {index % 2 === 0 && <p className='px-3 py-1 absolute top-3 left-3 text-xs bg-white text-gray-800 font-medium rounded-full'>Best Seller</p>}
//             <div className='p-4 pt-5'>
//                 <div className='flex items-center justify-between'>
//                     <p className='font-playfair text-xl font-medium text-gray-800'>{room.hotel.name}</p>
//                     <div className='flex items-center gap-1'>
//                         <img src={assets.starIconFilled} alt="star-icon" /> 4.5
//                     </div>
//                 </div>
//                 <div className='flex items-center gap-1 text-sm'>
//                     <img src={assets.heartIcon} alt="location-icon" />
//                     <span>{room.hotel.type}</span>
//                 </div>
//                 <div className='flex items-center justify-between mt-4'>
//                     <p><span className='text-xl text-gray-800'>{formatCurrency(room.pricePerNight)}</span>/night</p>
//                     <button className='px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-all cursor-pointer'>
//                         Book Now
//                     </button>
//                 </div>
//             </div>
//         </Link>
//     )
// }

// export default RoomCard