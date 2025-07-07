import RoomCard from "@/components/RoomCard";
import RoomsHero from "../components/RoomsHero";
import SearchForm from "../components/SearchForm";
import { useRooms } from "../queries/rooms";
import { roomPhotos } from "../data/rooms";
import RoomCardSkeleton from "../components/RoomCardSkeleton";
import { AlertCircle } from "lucide-react";
export default function Rooms() {
    const { data: rooms, isLoading, isError, error, refetch, status } = useRooms();

    const heroImages = roomPhotos;

    return (
        <div className="min-h-screen bg-gray-50">
            <RoomsHero imageUrls={heroImages} />
            <div className="absolute inset-x-0 bottom-0 transform translate-y-1/2 px-4 z-10">

                <div className="md:w-[50%] lg:w-[30%] w-[100%] max-w-full mx-auto">

                    <SearchForm onSearch={(v) => console.log(v)} />
                </div>
            </div>
            {/* Listing */}
            <section className="max-w-6xl mx-auto mt-24 lg:mt-12 px-4 py-32 grid gap-10 auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading && (
                    Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)
                )}

                {isError && (
                    <div className="col-span-full flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-lg">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <p className="text-red-600 text-lg font-medium">
                            {status === 500 ? "Something is wrong, please contact the administrator" : "Unable to load rooms"}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isLoading && !isError && rooms?.data.map((room, i) => (
                    <RoomCard key={room.slug} room={room} index={i} />
                ))}
            </section>
        </div>
    );
}
