import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import Title from "../Title";
import { ImageOff } from "lucide-react";
import TestimonialCard from "./TestimonialCard";

// Empty and error state components (could split further if preferred)
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 w-full">
        <ImageOff className="w-14 h-14 text-gray-300 mb-2" />
        <span className="text-gray-500 text-base mt-2">No guest testimonials yet.</span>
    </div>
);
const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16 w-full">
        <span className="animate-pulse mb-4">
            <ImageOff className="w-14 h-14 text-gray-200" />
        </span>
        <span className="text-gray-400 text-base mt-2">Loading testimonials...</span>
    </div>
);
const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 w-full">
        <ImageOff className="w-14 h-14 text-red-300 mb-2" />
        <span className="text-red-500 text-base mt-2">Failed to load testimonials.</span>
    </div>
);

const TestimonialsSection = () => {
    const api = useApi();
    const {
        data: reviews = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["latestReviews"],
        queryFn: async () => {
            const res = await api.get(`${API_PREFIX}/reviews/testimonials`);
            return res.data || [];
        },
    });

    return (
        <section className="flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 pt-20 pb-30 w-full">
            <Title
                title="What Our Guests Say"
                subTitle="Hear from our recent guests about their experiences at our resort."
            />
            {isLoading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState />
            ) : !reviews.length ? (
                <EmptyState />
            ) : (
                <div
                    className={`
            grid gap-8 grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            justify-center
            justify-items-center
            w-full mt-12
          `}
                    style={{
                        gridTemplateColumns:
                            reviews.length === 2
                                ? "repeat(2, minmax(0, 1fr))"
                                : undefined,
                        justifyContent: reviews.length < 3 ? "center" : undefined,
                    }}
                >
                    {reviews.map((review) => (
                        <TestimonialCard key={review.id} review={review} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default TestimonialsSection;
