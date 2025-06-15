import React from 'react'
import BookingDateForm from './BookingDateForm'
import SearchForm from './SearchForm'
import { useCart } from '../context/CartContext';
import { format } from 'date-fns';

const Hero = () => {
    
    return (
        // <div className='flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url("/src/assets/netania-cover.jpg")] backdrop-blur bg-no-repeat bg-cover bg-center h-screen'>
        //     <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full '>The Ultimate Beach Experience</p>
        //     <h1 className='font-playfair text-gray-900 text-2xl md:text-6xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl mt-2'>Netania De Laiya</h1>
        //     <p className='max-w-130 mt-2 text-gray-900 text-sm md:text-base'>Unparalled luxury and comfort await at the Laiya's most exclusive resort. Start your journey today</p>
        //     <BookingDateForm />
        // </div>
        <div className="relative h-screen bg-[url('/src/assets/netania-cover2.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 h-full">
                <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full text-white '>The Ultimate Beach Experience</p>
                <h1 className='font-playfair text-white text-2xl md:text-6xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl mt-2'>Netania De Laiya</h1>
                <p className='max-w-130 mt-2 text-white text-sm md:text-base'>Unparalled luxury and comfort await at the Laiya's most exclusive resort. Start your journey today</p>
                {/* <SearchForm /> */}
            </div>
            <div className="absolute inset-x-0 bottom-1 transform translate-y-8/12 px-4 z-10">

                <div className="w-[100%] md:w-[50%] lg:w-[50%] mx-auto">

                    <SearchForm />
                </div>
            </div>
        </div>

    )
}

export default Hero