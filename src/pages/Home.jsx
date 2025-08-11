import React from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '@/components/exclusive-offer/ExclusiveOffers'
import NewsLetter from '../components/NewsLetter'
import { TestimonialsSection } from '@/components/testimonials'
import SEO from '@/components/SEO'

const Home = () => {
    return (
        <>
      <SEO
        title="Beachfront Resort in Laiya, San Juan, Batangas"
        description="Beachfront resort in Laiya with pool and hotel-style rooms. Book Netania De Laiya for family vacations, barkada trips, and romantic getaways."
        canonical={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://netaniadelaiya.com/'}
        og={{
          title: 'Netania De Laiya – Beachfront Resort in Laiya, Batangas',
          description: 'Beachfront resort in Laiya with pool and hotel rooms. Family-friendly accommodations in San Juan, Batangas.',
          image: typeof window !== 'undefined' ? window.location.origin + '/og-home.jpg' : 'https://netaniadelaiya.com/og-home.jpg',
          url: 'https://netaniadelaiya.com/',
          type: 'website',
          locale: 'en_PH',
          siteName: 'Netania De Laiya'
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Resort',
          name: 'Netania De Laiya',
          url: 'https://netaniadelaiya.com/',
          image: 'https://netaniadelaiya.com/og-home.jpg',
          telephone: '+63 949 798 9831',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
            addressLocality: 'San Juan',
            addressRegion: 'Batangas',
            addressCountry: 'PH'
          },
          sameAs: [
            'https://www.facebook.com/profile.php?id=100064182843841',
            'https://www.instagram.com/netaniadelaiya/'
          ],
          amenityFeature: [
            { '@type': 'LocationFeatureSpecification', name: 'Beachfront' },
            { '@type': 'LocationFeatureSpecification', name: 'Swimming Pool' },
            { '@type': 'LocationFeatureSpecification', name: 'Hotel Rooms' }
          ]
        }}
      />
            <Hero />
            <FeaturedRooms />
            <ExclusiveOffers />
            <TestimonialsSection />
            <NewsLetter />
        </>
    )
}

export default Home