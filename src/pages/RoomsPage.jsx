
import { useMemo, useState } from "react";
import RoomCard from "@/components/RoomCard";
import RoomsHero from "../components/RoomsHero";
import SearchForm from "../components/SearchForm";
import { useRooms } from "../queries/rooms";
import { roomPhotos } from "../data/rooms";
import RoomCardSkeleton from "../components/RoomCardSkeleton";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { Link } from "react-router-dom";
import RoomBlock from "../components/common/RoomBlock";
import ResortPolicyDialog from "../components/common/ResortPolicyDialog";
export default function Rooms() {
    const { data: rooms, isLoading, isError, error, refetch, status } = useRooms();

    const heroImages = roomPhotos;

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <RoomsHero imageUrls={heroImages} />
            <div className="absolute inset-x-0 bottom-0 transform translate-y-1/2 px-4 z-10">

                <div className="md:w-[50%] lg:w-[30%] w-[100%] max-w-full mx-auto">

                    <SearchForm onSearch={(v) => console.log(v)} />
                </div>
            </div>

            {/* Listing */}
            <section className="relative max-w-6xl mx-auto mt-32 px-4 pb-24 ">
                {/* Loading state */}
                {isLoading && (
                    <div className="grid gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <RoomCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Error state */}
                {isError && (
                    <div className="flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-lg">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <p className="text-red-600 text-lg font-medium">
                            {status === 500
                                ? "Something went wrong, please contact the administrator"
                                : "Unable to load rooms"}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Success state */}
                {!isLoading && !isError && (
                    <div className="mt-20 space-y-16">
                        {rooms?.data.map((room, i) => (
                            <RoomBlock key={room.slug} room={room} reverse={i % 2 === 1} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
