// src/components/FeaturedRooms.jsx (updated)
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import RoomBlock from "./common/RoomBlock";
import Title from "./Title";
import { useNavigate } from "react-router-dom";
import * as lucideIcons from "lucide-react";

const FeaturedRooms = () => {
    const api = useApi();
    const navigate = useNavigate();
    const iconsModule = lucideIcons;
    
    // Fetch featured rooms from API
    const { data: featuredRooms, isLoading, error } = useQuery({
        queryKey: ["featuredRooms"],
        queryFn: async () => {
            const res = await api.get(`${API_PREFIX}/rooms/featured`);
            return res.data.data;  // PublicRoomCollection returns data array
        }
    });

    if (error) {
        // handle error state (could show message or fallback)
        console.error("Failed to load featured rooms:", error);
    }

    return (
        <div className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-white">
            <Title
            className="mt-24"
                title="Featured Rooms"
                subTitle="Discover our handpicked selection of exceptional rooms offering unparalleled luxury."
            />

            {/* Loading state */}
            {isLoading ? (
                <p>Loading featured rooms...</p>
            ) : (
                <div className="max-w-6xl mt-20 space-y-16">
                    {featuredRooms?.map((room, index) => (
                        <RoomBlock key={room.slug || index} room={room} index={index} reverse={index % 2 === 1} iconsModule={iconsModule} />
                    ))}
                    
                    {!isLoading && featuredRooms?.length === 0 && (
                        <p className="text-gray-600 text-sm italic mt-6">
                            No featured rooms available at the moment.
                        </p>
                    )}
                </div>
            )}

            <button
                className="my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded 
                   bg-white hover:bg-gray-50 transition-all cursor-pointer"
                onClick={() => navigate('/rooms')}
            >
                View All Rooms
            </button>
        </div>
    );
};

export default FeaturedRooms;