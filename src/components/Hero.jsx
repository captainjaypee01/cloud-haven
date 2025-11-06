import React from 'react'
import SearchForm from './SearchForm'
import { NETANIA_COVER_IMAGE } from '@/constants/AppConstant'
import OptimizedImage from '@/components/common/OptimizedImage'

const Hero = () => {
    
    return (
        <>
            <div className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0 -z-10 w-full h-full">
                    <OptimizedImage 
                        src={NETANIA_COVER_IMAGE} 
                        alt="Netania De Laiya beachfront resort in Laiya, Batangas - Premium beachfront accommodations with stunning ocean views" 
                        className="w-full h-full object-cover" 
                        aspectRatio="16/9"
                        loading="eager"
                    />
                </div>
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 h-full max-w-full">
                    <p className='bg-[#deb028]/50 px-3.5 py-1 rounded-full text-white '>The Ultimate Beach Experience</p>
                    <h1 className='font-playfair text-white text-6xl md:text-8xl md:text-[56x] md:leading[56px] font-bold md:font-extrabold max-w-xl-2 mt-2'>Netania De Laiya</h1>
                    <p className='mt-2 text-white text-xl'>A refined and exhilarating escape awaits</p>
                </div>
            </div>
            <div className="relative -mt-32 px-4 z-10 w-full">
                <div className="w-full md:w-[50%] lg:w-[50%] mx-auto">
                    <SearchForm />
                </div>
            </div>
        </>
    )
}

export default Hero