import RoomsHero from "../components/RoomsHero";
import SearchForm from "../components/SearchForm";
import { useRooms } from "../queries/rooms";
import { roomPhotos } from "@/data/rooms";
import RoomCardSkeleton from "../components/RoomCardSkeleton";
import { AlertCircle } from "lucide-react";
import RoomBlock from "../components/common/RoomBlock";
import * as lucideIcons from "lucide-react";
import SEO from "@/components/SEO";

const iconsModule = lucideIcons;
const ICON_OPTIONS = Object.keys(iconsModule).sort();

export default function RoomsPage() {
    const { data: rooms, isLoading, isError, refetch, status } = useRooms();

    const heroImages = roomPhotos;

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO
                title="Premium Rooms Laiya Batangas | Netania De Laiya"
                description="Browse premium beachfront accommodations at Netania De Laiya in Laiya, San Juan, Batangas. Beach View, Pool Access, and Garden View rooms with direct beach access, stunning ocean views, and luxury amenities. Book your stay today!"
                keywords="beachfront rooms Laiya, hotel rooms Batangas, beach view rooms, pool access rooms, luxury accommodations Batangas, beachfront hotel rooms, San Juan Batangas rooms, resort accommodations Philippines, beach hotel rooms"
                canonical={typeof window !== 'undefined' ? window.location.origin + '/rooms' : 'https://www.netaniadelaiya.com/rooms'}
                og={{
                  title: 'Premium Rooms Laiya Batangas | Netania De Laiya',
                  description: 'Browse premium beachfront accommodations at Netania De Laiya in Laiya, San Juan, Batangas. Beach View, Pool Access, and Garden View rooms with direct beach access and luxury amenities.',
                  image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757269133/pv-1.jpg',
                  url: 'https://www.netaniadelaiya.com/rooms',
                  type: 'website',
                  locale: 'en_PH',
                  siteName: 'Netania De Laiya'
                }}
                jsonLd={(function(){
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.netaniadelaiya.com';
                  const list = Array.isArray(rooms) ? rooms : (rooms?.data || []);
                  const items = list.slice(0, 20).map((r, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `${origin}/rooms/${r.slug || r.id}`,
                    name: r.name
                  }));
                  return [
                    {
                      '@context': 'https://schema.org',
                      '@type': 'BreadcrumbList',
                      itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
                        { '@type': 'ListItem', position: 2, name: 'Rooms', item: `${origin}/rooms` },
                      ]
                    },
                    {
                      '@context': 'https://schema.org',
                      '@type': 'ItemList',
                      name: 'Rooms and Accommodations',
                      itemListElement: items
                    }
                  ];
                })()}
            />
            <RoomsHero imageUrls={heroImages} />
            <div className="relative -mt-32 px-4 z-10 w-full">
                <div className="w-[100%] md:w-[50%] lg:w-[30%] mx-auto">
                    <SearchForm onSearch={() => {}} />
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
                            <RoomBlock key={room.slug} room={room} reverse={i % 2 === 1} iconsModule={iconsModule} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
