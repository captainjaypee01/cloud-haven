import { randomSubset } from '@/lib/utils';

/** Served from /public/images — same assets as before, no Cloudinary bandwidth for hero/fallback carousels */
const IMG = (name) => `/images/${name}`;

export const roomPhotos = [
    IMG('room-4.jpg'),
    IMG('room-1.jpg'),
    IMG('room-5.jpg'),
    IMG('room-3.jpg'),
    IMG('room-6.jpg'),
    IMG('room-2.jpg')
];

export const dayTourRoomPhotos = [
    IMG('day-tour-1.jpg'),
    IMG('day-tour-2.jpg'),
    IMG('day-tour-3.jpg'),
    IMG('day-tour-4.jpg'),
    IMG('day-tour-5.jpg'),
    IMG('day-tour-6.jpg'),
    IMG('day-tour-7.jpg'),
    IMG('day-tour-8.jpg'),
];

export const cabanaRoomPhotos = [
    IMG('day-tour-2.jpg'),
    IMG('day-tour-3.jpg'),
    IMG('day-tour-6.jpg'),
    IMG('day-tour-8.jpg'),
];

export const umbrellaRoomPhotos = [
    IMG('day-tour-1.jpg'),
    IMG('day-tour-4.jpg'),
    IMG('day-tour-5.jpg'),
    IMG('day-tour-7.jpg'),
];
