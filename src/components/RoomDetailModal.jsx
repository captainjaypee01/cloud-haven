import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useRoom } from "../queries/rooms";
import { formatCurrency } from "../utils/currency";
import { roomPhotos } from "../data/rooms";


export function RoomDetailModal({ roomId, open, onOpenChange }) {
    const { data: room, isLoading, isError, } = useRoom(roomId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {/* if you want external trigger, else omit */}
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full">
                <DialogHeader>
                    <DialogTitle>Room Details</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-20 text-center">Loading...</div>
                ) : isError || !room ? (
                    <div className="py-20 text-center text-red-500">Failed to load room.</div>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold">{room.name}</h2>
                        <p className="text-gray-600">
                            {formatCurrency(room.price)}/night • Max {room.max_guests} guests
                        </p>
                        <p className="text-md">
                            {room.short_description}
                        </p>

                        <Carousel opts={{ loop: true, align: "center" }} className="my-4 h-64">
                            <CarouselContent>
                                {(room?.images?.length ? room.images.map((img) => img?.secure_image_url || img?.url || img) : roomPhotos).map((src, i) => (
                                    <CarouselItem key={i} className="h-64">
                                        <img
                                            src={src}
                                            alt={`${room.name} photo ${i + 1}`}
                                            className="w-full h-full object-cover rounded-md"
                                            loading="lazy"
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" />
                        </Carousel>

                        <p className="text-gray-700 text-sm">{room.long_description}</p>
                    </>
                )}

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary" className="cursor-pointer">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
