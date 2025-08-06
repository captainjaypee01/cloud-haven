import React from "react";
import StarRating from "@/components/StarRating";

// Avatar helpers
const getInitial = (name = "") => name.trim().charAt(0).toUpperCase() || "?";
const colorPalette = [
    "bg-emerald-500", "bg-cyan-600", "bg-pink-500", "bg-purple-500", "bg-indigo-500"
];
const getColor = (name = "") =>
    colorPalette[name.charCodeAt(0) % colorPalette.length] || colorPalette[0];

const TestimonialCard = ({ review }) => {
    const user = review.user || {};
    const name = user?.first_name || "Guest";
    const initial = getInitial(name);
    const color = getColor(name);

    return (
        <article className="bg-white p-6 rounded-xl shadow max-w-sm w-full flex flex-col gap-2 items-center border border-gray-100">
            {user.profile_image_url ? (
                <img
                    className="w-12 h-12 rounded-full object-cover"
                    src={user.profile_image_url}
                    alt={name}
                />
            ) : (
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${color}`}
                >
                    {initial}
                </div>
            )}
            <h3 className="font-playfair text-lg mt-2 text-center">{name}</h3>
            <StarRating rating={review.rating} />
            <p className="text-gray-600 mt-2 text-center text-base min-h-[56px]">“{review.comment}”</p>
        </article>
    );
};

export default TestimonialCard;
