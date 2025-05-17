import React from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '../components/ExclusiveOffers'
import Testimonial from '../components/Testimonial'
import NewsLetter from '../components/NewsLetter'
import Footer from '../components/Footer'

const Home = () => {
    return (
        <>
            <Hero />
            <FeaturedRooms />
            <ExclusiveOffers />
            <Testimonial />
            <NewsLetter />
        </>
    )
}

export default Home