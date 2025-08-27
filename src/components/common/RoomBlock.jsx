
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

export default function RoomBlock({ room, index, reverse, iconsModule }) {
    const photos = roomPhotos.sort(() => Math.random() - 0.5);
    const { state } = useCart();
    const [showDatesDialog, setShowDatesDialog] = useState(false);

    const handleViewDetailsClick = useCallback((e) => {
        if (!state.checkIn || !state.checkOut) {
            e.preventDefault();
            setShowDatesDialog(true);
        }
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
                                            <img
                                                src={img?.secure_image_url}
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
                                            <img
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
                        Starting from: <span className="text-xl font-bold text-sky-700">{formatCurrency(room.price)}</span> / night
                    </p>
                    {/* Max guests (separate line) */}
                    <p className="text-gray-600 mb-4">
                        Maximum guests: <span className="font-medium">{room.max_guests}</span>
                    </p>

                    {/* Availability */}
                    {room.available_rooms !== undefined && (
                        <p className="text-sm text-emerald-700 mb-4">
                            {room.available_rooms} {room.available_rooms === 1 ? "room" : "rooms"} left for your selected dates
                        </p>
                    )}

                    {/* CTA */}
                    <div className="mt-auto flex space-x-3">
                        <Link
                            to={`/rooms/${room.slug}`}
                            onClick={handleViewDetailsClick}
                            className="inline-block px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700"
                        >
                            View Details
                        </Link>
                        {/* <Button variant="outline" asChild>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                Book Now
                            </a>
                        </Button> */}
                    </div>
                </div>
            </div>
            <RequireDatesDialog
                open={showDatesDialog}
                onOpenChange={setShowDatesDialog}
                targetHref={`/rooms/${room.slug}`}
            />
        </motion.article>
    );
}
