import React from 'react'
import { roomsDummyData } from '../assets/assets'
import RoomCard from './RoomCard'
import Title from './Title'
import { useNavigate } from 'react-router-dom'

const FeaturedRooms = () => {
    const navigate = useNavigate()
    return (
        <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 bg-slate-50 py-20'>
            <Title
                title='Featured Rooms'
                subTitle='Discover our handpicked selection of exceptional rooms around the resort, offering unparalleled luxury and unforgetable experiences.'
            />
            <div className='flex flex-wrap items-center justify-center gap-6 mt-20'>
                {roomsDummyData.slice(0, 4).map((room, index) => (
                    <RoomCard key={room._id} room={room} index={index} />
                ))}
            </div>
            <button className='my-16 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer'
                onClick={() => { navigate('/rooms') }}
            >
                View All Rooms
            </button>
        </div>
    )
}

export default FeaturedRooms