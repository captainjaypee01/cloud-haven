
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

import { Link } from "react-router-dom";
import { roomPhotos } from "@/data/rooms";
import { formatCurrency } from "../../utils/currency";
import { useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import RequireDatesDialog from "@/components/common/RequireDatesDialog";
import { useRoomAvailability } from "@/hooks/useRoomAvailability";
import { RoomAvailabilityBadge } from "@/components/common/RoomAvailabilityBadge";
import { QuickBookingDialog } from "@/components/common/QuickBookingDialog";
import OptimizedImage from '@/components/common/OptimizedImage';

export default function RoomBlock({ room, index, reverse, iconsModule }) {
    const photos = roomPhotos.sort(() => Math.random() - 0.5);
    const { state } = useCart();
    const [showDatesDialog, setShowDatesDialog] = useState(false);
    const [showBookingDialog, setShowBookingDialog] = useState(false);

    // Use availability data from the main rooms API if available (when dates are provided)
    // Otherwise fall back to individual room availability hook
    const hasAvailabilityData = room.available_count !== null && room.available_count !== undefined;
    
    const {
        availableUnits: hookAvailableUnits,
        isLoading: availabilityLoading,
        isError: availabilityError,
        isDebouncing,
        isUnavailable: hookIsUnavailable,
        pending: hookPending,
    } = useRoomAvailability(room.slug, state.checkIn, state.checkOut, {
        enabled: !hasAvailabilityData && !!(state.checkIn && state.checkOut) // Only call hook if no data from main API
    });

    // Use data from main API if available, otherwise use hook data
    const availableUnits = hasAvailabilityData ? room.available_count : hookAvailableUnits;
    const pending = hasAvailabilityData ? (room.pending_count || 0) : hookPending;
    const isUnavailable = hasAvailabilityData ? (room.available_count === 0) : hookIsUnavailable;

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
        <motion.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="w-full"
        >

            <div
                className={`flex flex-col overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-lg ring-1 ring-black/5 lg:flex-row ${reverse ? "lg:flex-row-reverse" : ""}`}
            >
                {/* Carousel with room photos */}
                <div className="lg:w-1/2 w-full h-100 lg:h-auto">
                    <Carousel className="w-full h-full">
                        <CarouselContent>
                            {room?.images?.length > 0 ? (
                                <>
                                    {room?.images?.map((img, idx) => (
                                        <CarouselItem key={idx} className="w-full h-100 lg:h-[400px]">
                                            <OptimizedImage
                                                src={img?.secure_image_url || img?.image_url}
                                                alt={`${img?.name}-${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </CarouselItem>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {photos.map((src, idx) => (
                                        <CarouselItem key={idx} className="w-full h-100 lg:h-[400px]">
                                            <OptimizedImage
                                                src={src}
                                                alt={`${room.name} image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </CarouselItem>
                                    ))}
                                </>
                            )
                            }
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                    </Carousel>
                </div>

                {/* Details */}
                <div className="lg:w-1/2 w-full p-6 flex flex-col">
                    {/* Name & description */}
                    <h4 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                        {room.name}
                    </h4>
                    {room.short_description && (
                        <p className="text-gray-700 mb-4">{room.short_description}</p>
                    )}

                    {/* Amenities */}
                    {room.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {room.amenities.slice(0, 6)
                                .map((am, idx) => {
                                    const Icon = iconsModule[am.icon] || iconsModule.HelpCircle;
                                    return (
                                        <Badge key={idx} variant="secondary" className="text-sm">
                                            <Icon className="w-5 h-5" />
                                            {/* <img src={facilityIcons[am?.name]} alt={am?.name} className='w-5 h-5' /> */}
                                            {am.name}
                                        </Badge>
                                    )
                                }
                                )}
                            {room.amenities.length > 6 && (
                                <Badge variant="outline" className="text-xs">+{room.amenities.length - 6}</Badge>
                            )}
                        </div>
                    )}

                    {/* Price (new line) */}
                    <p className="text-gray-800 font-medium mb-2">
                        {state.checkIn && state.checkOut && room.stay_total != null ? (
                            <>
                                <span className="text-xl font-bold text-sky-700">{formatCurrency(room.stay_total)}</span>
                                <span className="text-gray-600"> total for stay</span>
                                <span className="block text-sm text-gray-500">
                                    {formatCurrency(room.price_per_night_avg ?? room.price)} avg / night
                                </span>
                            </>
                        ) : (
                            <>
                                Starting from: <span className="text-xl font-bold text-sky-700">{formatCurrency(room.price)}</span> / night
                            </>
                        )}
                    </p>
                    {/* Max guests (separate line) */}
                    <p className="text-gray-600 mb-4">
                        Maximum guests: <span className="font-medium">{room.max_guests}</span>
                    </p>

                    {/* Availability Badge */}
                    {state.checkIn && state.checkOut && (
                        <div className="mb-4">
                            <RoomAvailabilityBadge
                                availableUnits={availableUnits}
                                pending={pending}
                                isLoading={availabilityLoading}
                                isError={availabilityError}
                                isDebouncing={isDebouncing}
                                size="default"
                            />
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto flex space-x-3">
                        <Button
                            asChild
                            variant="default"
                            className="bg-sky-600 hover:bg-sky-700"
                        >
                            <Link
                                to={`/rooms/${room.slug}`}
                                onClick={handleViewDetailsClick}
                            >
                                View Details
                            </Link>
                        </Button>
                        {state.checkIn && state.checkOut && (
                            <Button 
                                variant={isUnavailable ? "secondary" : "outline"} 
                                disabled={isUnavailable || availabilityLoading}
                                className="cursor-pointer"
                                onClick={handleBookNow}
                            >
                                {isUnavailable ? "Sold Out" : "Book Now"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
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
        </motion.article>
    );
}
