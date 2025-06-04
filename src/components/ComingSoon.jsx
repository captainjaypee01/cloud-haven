import React from 'react'

const ComingSoon = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center relative px-4">
            <div className='absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-30 bg-[url("/src/assets/netania-cover.jpg")]'>
            </div>
            <h1 className="text-5xl md:text-7xl text-white font-bold mb-8 z-10">Coming Soon</h1>
        </div >
    )
}

export default ComingSoon