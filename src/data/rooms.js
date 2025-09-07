import { randomSubset } from '@/lib/utils';

export const roomPhotos = [
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756914612/room-4.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756910584/room-1.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756914610/room-5.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756910578/room-3.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756914611/room-6.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756910579/room-2.jpg'
];

export const dayTourRoomPhotos = [
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255495/day-tour-1.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255495/day-tour-2.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-3.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-4.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-5.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255493/day-tour-6.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-7.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255738/day-tour-8.jpg',
];

export const cabanaRoomPhotos = [
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255495/day-tour-2.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-3.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255493/day-tour-6.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255738/day-tour-8.jpg',
];

export const umbrellaRoomPhotos = [
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255495/day-tour-1.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-4.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-5.jpg',
    'https://res.cloudinary.com/dm3gsotk5/image/upload/v1757255494/day-tour-7.jpg',
];
export const rooms = [
    {
        _id: "67f7647c197ac559e4089b96",
        name: "Akinah 1",
        roomType: "Double Bed",
        photos: randomSubset(roomPhotos, { allowEmpty: false, rng: Math.random }),
        price: 320,
        guests: 4,
        amenities: ["Pool Access", "Free WiFi", "Free Breakfast", "Mountain View", "Room Service"],
        description: "Wake up to ocean vistas...",
        long_description: "Guests will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guest, at the guest slot please mark the number of guests to get the exact price for group. The Guests will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.",
    },
    {
        _id: "67f7647c197ac559e4089b97",
        name: "Container Lodge",
        roomType: "Double Bed",
        photos: randomSubset(roomPhotos, { allowEmpty: false, rng: Math.random }),
        price: 320,
        guests: 4,
        amenities: ["Pool Access", "Free WiFi", "Free Breakfast", "Mountain View", "Room Service"],
        description: "Wake up to ocean vistas...",
        long_description: "Guests will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guest, at the guest slot please mark the number of guests to get the exact price for group. The Guests will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.",
    },
    {
        _id: "67f7647c197ac559e4089b98",
        name: "Akinah 9",
        roomType: "Double Bed",
        photos: randomSubset(roomPhotos, { allowEmpty: false, rng: Math.random }),
        price: 320,
        guests: 4,
        amenities: ["Pool Access", "Free WiFi", "Free Breakfast", "Mountain View", "Room Service"],
        description: "Wake up to ocean vistas...",
        long_description: "Guests will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guest, at the guest slot please mark the number of guests to get the exact price for group. The Guests will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.",

    },
    {
        _id: "67f7647c197ac559e4089b99",
        name: "Cabana",
        roomType: "Single Bed",
        photos: randomSubset(roomPhotos, { allowEmpty: false, rng: Math.random }),
        price: 320,
        guests: 4,
        amenities: ["Pool Access", "Free WiFi", "Free Breakfast", "Mountain View", "Room Service"],
        description: "Wake up to ocean vistas...",
        long_description: "Guests will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guest, at the guest slot please mark the number of guests to get the exact price for group. The Guests will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.",
    },
    // more rooms ...
];
