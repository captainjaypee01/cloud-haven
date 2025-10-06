import React from 'react'
import SearchForm from './SearchForm'
import { NETANIA_COVER_IMAGE } from '@/constants/AppConstant'

const Hero = () => {
    
    return (
        <div className="relative h-screen bg-cover bg-center" style={{ backgroundImage: `url(${NETANIA_COVER_IMAGE})` }}>
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 h-full">
                <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full text-white '>The Ultimate Beach Experience</p>
                <h1 className='font-playfair text-white text-4xl md:text-6xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl mt-2'>Netania De Laiya</h1>
                <p className='max-w-xs mt-2 text-white text-sm md:text-base'>A refined and exhilarating escape awaits</p>
            </div>
            <div className="absolute inset-x-0 bottom-1 transform translate-y-1/2 px-4 z-10">
                <div className="w-[100%] md:w-[50%] lg:w-[50%] mx-auto">
                    <SearchForm />
                </div>
            </div>
        </div>
    )
}

export default Hero