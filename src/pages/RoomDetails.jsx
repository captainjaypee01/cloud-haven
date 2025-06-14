import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { facilityIcons, roomCommonData, roomsDummyData } from '../assets/assets'
import StarRating from '../components/StarRating'
import { formatCurrency } from '../utils/currency'
import { roomPhotos, rooms } from '../data/rooms'
import SearchForm from '../components/SearchForm'
import { useRoom } from '../queries/rooms'
import { useAppContext } from '../context/AppContext'
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon } from 'lucide-react'

const RoomDetails = () => {
    const { roomId } = useParams()
    const { navigate } = useAppContext();
    const [mainImage, setMainImage] = useState(roomPhotos[0])
    const { data: room, isLoading, isError, error, status } = useRoom(roomId);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    // ❷ Show error
    if (isError) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4 bg-red-50 p-6 rounded-lg py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
                <AlertCircleIcon className="h-8 w-8 text-red-500" />
                <p className="text-red-600 text-lg font-medium">
                    {error.message}
                </p>
                <button
                    onClick={() => navigate('/rooms')}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                >
                    Go back to Accommodations
                </button>
            </div>
        );
    }
    return room && (
        <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>

            {/* Room Details */}
            <div className='flex flex-col md:flex-row items-start md:items-center gap-2'>
                <h1 className='text-3xl md:text-4xl font-playfair'>{room.name} <span className='font-inter text-sm'>({room.roomType})</span></h1>
                <p className='text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full'>20% OFF</p>
            </div>

            {/* Room Rating */}
            <div className='flex items-center gap-1 mt-2'>
                <StarRating />
                <p className='ml-2'>200+ reviews</p>
            </div>

            {/* Room Short Description */}
            <div className='flex-items-center gap-1 text-gray-500 mt-2'>
                <span>{room.description}</span>
            </div>

            {/* Room Short Description */}
            <div className='flex flex-col lg:flex-row mt-6 gap-6'>
                <div className='lg:w-1/2 w-full'>
                    <img src={mainImage} alt="Room Image" className='w-full rounded-xl shadow-lg object-cover' />
                </div>
                <div className='grid grid-cols-2 gap-4 lg:w-1/2 w-full'>
                    {roomPhotos.length > 1 && roomPhotos.map((image, index) => (
                        <img onClick={() => setMainImage(image)} key={index} src={image} alt="Room Image" className={`w-full h-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image && 'outline-3 outline-orange-500'}`} />
                    ))}
                </div>
            </div>

            {/* Room Highlights */}
            <div className='flex flex-col md:flex-row md:justify-between mt-10'>
                <div>
                    <h1 className='text-3xl md:text-4xl font-playfair'>Experience Luxury Like Never Before</h1>
                    <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
                        {room?.amenities && room?.amenities.map((item, index) => (
                            <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100'>
                                <img src={facilityIcons[item?.name]} alt={item?.name} className='w-5 h-5' />
                                <p className="text-xs">{item?.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Room Price */}
                <p className='text-2xl font-medium'>{formatCurrency(room.price)} /night</p>
            </div>

            <div className='flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl mx-auto mt-16 max-w-6xl'>
                <SearchForm />
            </div>

            {/* Common Specifications */}
            <div className='mt-25 space-y-4'>
                {roomCommonData.map((spec, index) => (
                    <div key={index} className='flex items-start gap-2'>
                        <img src={spec.icon} alt={`${spec.title}-icon`} className='w-6.5' />
                        <div>
                            <p className="text-base">{spec.title}</p>
                            <p className="text-gray-500">{spec.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500">
                <p>{room.long_description}</p>
            </div>

            {/* Hosted By */}
            <div className="flex flex-col items-start gap-4">
                <div className='flex gap-4'>
                    <img src="/src/assets/netania-logo.jpg" alt="Host" className='h-14 w-14 md:h-18 md:w-18 rounded-full' />
                    <div>
                        <p className='text-lg md:text-xl'>{room.name}</p>
                        <div className='flex items-center mt-1'>
                            <StarRating />
                            <p className="ml-2">200+ Reviews</p>
                        </div>
                    </div>
                </div>
            </div>
            <button className="px-6 py-2 5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer">Contact Now</button>
        </div>
    )
}

export default RoomDetails