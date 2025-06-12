
import roomImg1 from '@/assets/roomImg1.png'
import roomImg2 from '@/assets/roomImg2.png'
import roomImg3 from '@/assets/roomImg3.png'
import roomImg4 from '@/assets/roomImg4.png'

export const rooms = [
  {
    id: 1,
    name: "Ocean View Suite",
    photos: [
      roomImg1,
      roomImg2,
      roomImg3,
      roomImg4,
    ],
    price: 320,
    guests: 4,
    amenities: ["Sea-view", "Wi-Fi", "Breakfast"],
    description: "Wake up to ocean vistas...",
  },
  {
    id: 2,
    name: "Ocean View Suite",
    photos: [
      roomImg2,
      roomImg3,
      roomImg1,
      roomImg4,
    ],
    price: 320,
    guests: 4,
    amenities: ["Sea-view", "Wi-Fi", "Breakfast"],
    description: "Wake up to ocean vistas...",
  },
  {
    id: 3,
    name: "Ocean View Suite",
    photos: [
      roomImg3,
      roomImg1,
      roomImg2,
      roomImg4,
    ],
    price: 320,
    guests: 4,
    amenities: ["Sea-view", "Wi-Fi", "Breakfast"],
    description: "Wake up to ocean vistas...",
  },
  {
    id: 4,
    name: "Ocean View Suite",
    photos: [
      roomImg4,
      roomImg1,
      roomImg2,
      roomImg3,
    ],
    price: 320,
    guests: 4,
    amenities: ["Sea-view", "Wi-Fi", "Breakfast"],
    description: "Wake up to ocean vistas...",
  },
  // more rooms ...
];
