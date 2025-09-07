import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { Users, Clock, Eye } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import { roomPhotos, cabanaRoomPhotos, umbrellaRoomPhotos } from "@/data/rooms";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { RoomAvailabilityBadge } from "@/components/common/RoomAvailabilityBadge";

export function DayTourRoomCard({ room, onAddToCart, selectedDate, currentPricing, availability }) {
    const { navigate } = useAppContext();
    const handleAddToCartClick = () => {
        // Just call the parent's onAddToCart - the dialog will be handled at the page level
        onAddToCart(room);
    };

    // Get photos for this room (use room images if available, otherwise use random room photos)
    const photos = room.images?.length ?
        room.images.map(img => img.secure_image_url || img.url) :
        (room?.name?.toLowerCase().includes('cabana') ? cabanaRoomPhotos.sort(() => Math.random() - 0.5) : umbrellaRoomPhotos.sort(() => Math.random() - 0.5));

    return (
        <Card className="w-full overflow-hidden py-0">
            {/* Photo Slider - Top */}
            <div className="h-64">
                <Carousel
                    opts={{ loop: true, align: "center" }}
                    className="w-full h-full"
                >
                    <CarouselContent>
                        {photos.slice(0, 5).map((src, i) => (
                            <CarouselItem key={i} className="h-64">
                                <img
                                    src={src}
                                    alt={`${room.name} photo ${i + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                </Carousel>
            </div>

            {/* Room Details - Bottom */}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{room.name}</CardTitle>
                    {selectedDate && (
                        <RoomAvailabilityBadge
                            availableUnits={room.available_units}
                            pending={room.pending || 0}
                            isLoading={false}
                            isError={false}
                            isDebouncing={false}
                            size="default"
                            className="ml-2"
                        />
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                </div>
            </CardHeader>

            <CardContent className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        {currentPricing ? (
                            <>
                                <span className="text-2xl font-semibold">
                                    {formatCurrency(currentPricing.price_per_pax)}
                                    <span className="text-sm text-gray-500 font-normal">/pax</span>
                                </span>
                                <div className="text-xs text-blue-600 mt-1">
                                    {currentPricing.name}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl font-semibold text-gray-400">
                                    Select date
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                    to see pricing
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Room Capacity Range */}
                <div className="text-sm text-gray-600">
                    <span className="font-medium">Capacity:</span> {room.min_guests || 1} - {room.max_guests_range || room.max_guests} guests
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-2"
                        onClick={() => navigate(`/day-tour/${room.slug}`)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                    </Button>
                    <Button
                        onClick={handleAddToCartClick}
                        className="flex-2"
                        disabled={!selectedDate || !currentPricing || room.available_units === 0}
                    >
                        {!selectedDate ? 'Select Date First' :
                            !currentPricing ? 'No Pricing Available' :
                                room.available_units === 0 ? 'Not Available' :
                                    'Add to Cart'}
                    </Button>
                </div>
            </CardContent>

        </Card>
    );
}
