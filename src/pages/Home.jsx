import React, { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '@/components/exclusive-offer/ExclusiveOffers'
import ExclusiveOffersDialog from '@/components/exclusive-offer/ExclusiveOffersDialog'
import ScamAwarenessDialog from '@/components/ScamAwarenessDialog'
import NewsLetter from '../components/NewsLetter'
import { TestimonialsSection } from '@/components/testimonials'
import SEOContent from '../components/SEOContent'
import AboutSection from '../components/AboutSection'
import SocialMediaLinks from '../components/SocialMediaLinks'
import FAQSection from '../components/FAQSection'
import PerformanceOptimizer from '../components/PerformanceOptimizer'
import MobileFix from '../components/MobileFix'
import SEO from '@/components/SEO'

const Home = () => {
    const [showOffersDialog, setShowOffersDialog] = useState(true);
    const [showScamAwarenessDialog, setShowScamAwarenessDialog] = useState(true);


    return (
        <>
      <SEO
        title="Beachfront Resort Laiya Batangas | Netania De Laiya"
        description="Discover paradise at Netania De Laiya - a beachfront resort in Laiya, San Juan, Batangas. Premium accommodations with direct beach access, stunning infinity pool, and exceptional service. Perfect for families and romantic getaways."
        canonical={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://www.netaniadelaiya.com/'}
        og={{
          title: 'Beachfront Resort Laiya Batangas | Netania De Laiya',
          description: 'Discover paradise at Netania De Laiya - a beachfront resort in Laiya, San Juan, Batangas. Premium accommodations with direct beach access, stunning infinity pool, and exceptional service.',
          image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1754846908/bg-cover.jpg',
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
          image: 'https://www.netaniadelaiya.com/logo.jpg',
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
            <PerformanceOptimizer />
            <MobileFix />
            <Hero />
            <SEOContent />
            <FeaturedRooms />
            <AboutSection />
            <SocialMediaLinks />
            <FAQSection />
            <ExclusiveOffers />
            <TestimonialsSection />
            <NewsLetter />
            
            {/* Exclusive Offers Dialog */}
            <ExclusiveOffersDialog 
                open={showOffersDialog} 
                onOpenChange={setShowOffersDialog} 
            />
            
            {/* Scam Awareness Dialog */}
            <ScamAwarenessDialog 
                open={showScamAwarenessDialog} 
                onOpenChange={setShowScamAwarenessDialog} 
            />
        </>
    )
}

export default Home