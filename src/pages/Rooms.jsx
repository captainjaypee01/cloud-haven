import RoomCard from "@/components/RoomCard";
import { rooms } from "@/data/rooms";
import BookingDateForm from "../components/BookingDateForm";
import { useState } from "react";
import RoomsHero from "../components/RoomsHero";
import SearchForm from "../components/SearchForm";

export default function Rooms() {
    const heroImages = rooms.map((r) => r.photos[0]);
    return (
        <div className="min-h-screen bg-gray-50">
            <RoomsHero imageUrls={heroImages} />
            <div className="absolute inset-x-0 bottom-0 transform translate-y-1/2 px-4 z-10">

                <div className="md:w-[70%] lg:w-[80%] w-[100%] max-w-full mx-auto">

                    <SearchForm onSearch={(v) => console.log(v)} />
                </div>
            </div>
            {/* Listing */}
            <section className="max-w-6xl mx-auto px-4 py-32 grid gap-10 auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room, i) => (
                    <RoomCard key={room.id} room={room} index={i} />
                ))}
            </section>
        </div>
    );
}
