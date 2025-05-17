import React from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '../components/ExclusiveOffers'
import Testimonial from '../components/Testimonial'

const Home = () => {
    return (
        <>
            <Hero />
            <FeaturedRooms />
            <ExclusiveOffers />
            <Testimonial />
        </>
    )
}

export default Home