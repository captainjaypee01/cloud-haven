import React, { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '@/components/exclusive-offer/ExclusiveOffers'
import ExclusiveOffersDialog from '@/components/exclusive-offer/ExclusiveOffersDialog'
import NewsLetter from '../components/NewsLetter'
import { TestimonialsSection } from '@/components/testimonials'
import SEO from '@/components/SEO'

const Home = () => {
    const [showOffersDialog, setShowOffersDialog] = useState(true);


    return (
        <>
      <SEO
        title="Beachfront Resort in Laiya, San Juan, Batangas"
        description="Experience luxury beachfront accommodations at Netania De Laiya. Enjoy our pristine pool, hotel-quality rooms, and stunning ocean views in San Juan, Batangas. Perfect for families and romantic getaways."
        canonical={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://www.netaniadelaiya.com/'}
        og={{
          title: 'Beachfront Resort in Laiya, San Juan, Batangas',
          description: 'Experience luxury beachfront accommodations at Netania De Laiya. Enjoy our pristine pool, hotel-quality rooms, and stunning ocean views in San Juan, Batangas.',
          image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756913943/policy-1_b6xkhg.jpg',
          url: 'https://www.netaniadelaiya.com/',
          type: 'website',
          locale: 'en_PH',
          siteName: 'Netania De Laiya'
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Resort',
          name: 'Netania De Laiya',
          url: 'https://www.netaniadelaiya.com/',
          image: 'https://www.netaniadelaiya.com/og-home.jpg',
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
            
            {/* Exclusive Offers Dialog */}
            <ExclusiveOffersDialog 
                open={showOffersDialog} 
                onOpenChange={setShowOffersDialog} 
            />
        </>
    )
}

export default Home