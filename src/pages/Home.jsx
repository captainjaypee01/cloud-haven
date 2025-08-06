import React from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '@/components/exclusive-offer/ExclusiveOffers'
import NewsLetter from '../components/NewsLetter'
import { TestimonialsSection } from '@/components/testimonials'

const Home = () => {
    return (
        <>
            <Hero />
            <FeaturedRooms />
            <ExclusiveOffers />
            <TestimonialsSection />
            <NewsLetter />
        </>
    )
}

export default Home