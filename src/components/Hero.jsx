import React from 'react'
import BookingForm from './BookingForm'

const Hero = () => {
    return (
        <div className='flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url("/src/assets/netania-cover.jpg")] bg-no-repeat bg-cover bg-center h-screen'>
            <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full '>The Ultimate Beach Experience</p>
            <h1 className='font-playfair text-gray-900 text-2xl md:text-6xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl mt-2'>Netania De Laiya</h1>
            <p className='max-w-130 mt-2 text-gray-900 text-sm md:text-base'>Unparalled luxury and comfort await at the Laiya's most exclusive resort. Start your journey today</p>
            <BookingForm />
        </div>
    )
}

export default Hero