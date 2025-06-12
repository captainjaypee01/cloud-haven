import React from 'react'
import BookingDateForm from './BookingDateForm'
import SearchForm from './SearchForm'

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

                <div className="md:w-[70%] lg:w-[80%] w-[100%] max-w-full mx-auto">

                    <SearchForm onSearch={(v) => console.log(v)} />
                </div>
            </div>
        </div>

        // <div className="flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white min-h-screen bg-gray-900">
        //     <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full '>The Ultimate Beach Experience</p>
        //     <h1 className='font-playfair text-white text-2xl md:text-6xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl mt-2'>Netania De Laiya</h1>
        //     <p className='max-w-130 mt-2 text-white text-sm md:text-base'>Unparalled luxury and comfort await at the Laiya's most exclusive resort. Start your journey today</p>
        //     <BookingDateForm />
        //     <h1 className="text-5xl md:text-7xl text-white font-bold mb-8 z-10">Coming Soon</h1>
        //     <div className='absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-30 bg-[url("/src/assets/netania-cover.jpg")]'>
        //     </div>
        // </div >
    )
}

export default Hero