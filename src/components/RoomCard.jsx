import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { roomPhotos } from "@/data/rooms";
import { formatCurrency } from "../utils/currency";

export default function RoomCard({ room, index }) {
    const photos = roomPhotos.sort(() => Math.random() - 0.5);
    return (
        <motion.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="w-full"
        >
            <Card className="overflow-hidden shadow-lg">
                <Carousel

                    opts={{ loop: true, align: "center" }}
                    className="w-full h-64">
                    <CarouselContent>
                        {photos.map((src, i) => (
                            <CarouselItem key={i} className="h-64">
                                <img
                                    src={src}
                                    alt={`${room.name} photo ${i + 1}`}
                                    className="w-full h-64 object-cover"
                                    loading="lazy"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                </Carousel>

                <CardHeader>
                    <CardTitle className="text-2xl">{room.name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <p className="text-gray-700">{room.description}</p>
                    <ul className="flex flex-wrap gap-2 text-sm text-sky-700">
                        {room.amenities.map((a, _index) => (
                            <li key={_index} className="after:content-[','] last:after:content-['']">
                                {a?.name}
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{formatCurrency(room.price)}/night</span>
                        <Link to={`/rooms/${room.slug}`} onClick={() => scrollTo(0, 0)} key={room.slug}>
                            <Button size="sm" className="cursor-pointer">View Details</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </motion.article>
    );
}


// import React from 'react'
// import { Link } from 'react-router-dom'
// import { assets } from '../assets/assets'
// import { formatCurrency } from '../utils/currency'

// const RoomCard = ({ room, index }) => {
//     return (
//         <Link to={'/rooms/' + room._id} onClick={() => scrollTo(0, 0)} key={room._id}
//             className='relative max-w-70 w-full rounded-xl overflow-hidden bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]'>
//             <img src={room.images[0]} alt="" />
//             {index % 2 === 0 && <p className='px-3 py-1 absolute top-3 left-3 text-xs bg-white text-gray-800 font-medium rounded-full'>Best Seller</p>}
//             <div className='p-4 pt-5'>
//                 <div className='flex items-center justify-between'>
//                     <p className='font-playfair text-xl font-medium text-gray-800'>{room.hotel.name}</p>
//                     <div className='flex items-center gap-1'>
//                         <img src={assets.starIconFilled} alt="star-icon" /> 4.5
//                     </div>
//                 </div>
//                 <div className='flex items-center gap-1 text-sm'>
//                     <img src={assets.heartIcon} alt="location-icon" />
//                     <span>{room.hotel.type}</span>
//                 </div>
//                 <div className='flex items-center justify-between mt-4'>
//                     <p><span className='text-xl text-gray-800'>{formatCurrency(room.pricePerNight)}</span>/night</p>
//                     <button className='px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-all cursor-pointer'>
//                         Book Now
//                     </button>
//                 </div>
//             </div>
//         </Link>
//     )
// }

// export default RoomCard