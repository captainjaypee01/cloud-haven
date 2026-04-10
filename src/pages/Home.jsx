import React, { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import FeaturedRooms from '../components/FeaturedRooms'
import ExclusiveOffers from '@/components/exclusive-offer/ExclusiveOffers'
import ExclusiveOffersDialog from '@/components/exclusive-offer/ExclusiveOffersDialog'
import ScamAwarenessDialog from '@/components/ScamAwarenessDialog'
import NoticeDialog from '@/components/NoticeDialog'
import NewsLetter from '../components/NewsLetter'
import { TestimonialsSection } from '@/components/testimonials'
import SEOContent from '../components/SEOContent'
import AboutSection from '../components/AboutSection'
import SocialMediaLinks from '../components/SocialMediaLinks'
import FAQSection from '../components/FAQSection'
import PerformanceOptimizer from '../components/PerformanceOptimizer'
import MobileFix from '../components/MobileFix'
import SEO from '@/components/SEO'
import { STATIC_IMG, staticImgAbsolute } from '@/constants/staticImages'

const Home = () => {
  const [showOffersDialog, setShowOffersDialog] = useState(true);
  // const [showScamAwarenessDialog, setShowScamAwarenessDialog] = useState(true);
  const [showNoticeDialog, setShowNoticeDialog] = useState(true);


  return (
    <>
      <SEO
        title="Beachfront Resort Laiya Batangas | Netania De Laiya"
        description="Book your stay at Netania De Laiya - premium beachfront resort in Laiya, San Juan, Batangas. Direct beach access, infinity pool, luxury accommodations, Day Tour packages. Perfect for families, couples, and groups. Reserve your beachfront room today!"
        keywords="beachfront resort Laiya Batangas, beach hotel San Juan, resort Batangas, beachfront hotel Philippines, Laiya beach resort, San Juan Batangas hotel, beachfront accommodations, luxury resort Batangas, family resort Philippines, romantic getaway Batangas"
        canonical={typeof window !== 'undefined' ? window.location.origin + '/' : 'https://www.netaniadelaiya.com/'}
        og={{
          title: 'Beachfront Resort Laiya Batangas | Netania De Laiya',
          description: 'Book your stay at Netania De Laiya - premium beachfront resort in Laiya, San Juan, Batangas. Direct beach access, infinity pool, luxury accommodations, Day Tour packages.',
          image: staticImgAbsolute(STATIC_IMG.bgCover),
          url: 'https://www.netaniadelaiya.com/',
          type: 'website',
          locale: 'en_PH',
          siteName: 'Netania De Laiya'
        }}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Resort',
            name: 'Netania De Laiya',
            url: 'https://www.netaniadelaiya.com/',
            image: staticImgAbsolute(STATIC_IMG.bgCover),
            logo: 'https://www.netaniadelaiya.com/logo.jpg',
            telephone: '+63 949 798 9831',
            email: 'info@netaniadelaiya.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
              addressLocality: 'San Juan',
              addressRegion: 'Batangas',
              addressCountry: 'PH',
              postalCode: '4226'
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: '13.7565',
              longitude: '121.3972'
            },
            priceRange: '$$',
            starRating: {
              '@type': 'Rating',
              ratingValue: '4.5',
              bestRating: '5',
              worstRating: '1'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.5',
              reviewCount: '150',
              bestRating: '5',
              worstRating: '1'
            },
            sameAs: [
              'https://www.facebook.com/profile.php?id=100064182843841',
              'https://www.instagram.com/netaniadelaiya/'
            ],
            amenityFeature: [
              { '@type': 'LocationFeatureSpecification', name: 'Beachfront', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Swimming Pool', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Hotel Rooms', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Parking', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Restaurant', value: true },
              { '@type': 'LocationFeatureSpecification', name: 'Day Tour Facilities', value: true }
            ],
            checkinTime: '15:00',
            checkoutTime: '13:00'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Netania De Laiya',
            url: 'https://www.netaniadelaiya.com/',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.netaniadelaiya.com/search?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            },
            publisher: {
              '@type': 'Organization',
              name: 'Netania De Laiya',
              logo: 'https://www.netaniadelaiya.com/logo.jpg'
            }
          }
        ]}
      />
      <PerformanceOptimizer />
      <MobileFix />
      <Hero />
      <SEOContent />
      <FeaturedRooms />
      <AboutSection />
      <ExclusiveOffers />
      <SocialMediaLinks />
      <FAQSection />
      <TestimonialsSection />
      {/* <NewsLetter /> */}

      {/* Exclusive Offers Dialog */}
      <ExclusiveOffersDialog
        open={showOffersDialog}
        onOpenChange={setShowOffersDialog}
      />

      {/* Scam Awareness Dialog */}
      {/* <ScamAwarenessDialog 
                open={showScamAwarenessDialog} 
                onOpenChange={setShowScamAwarenessDialog} 
            /> */}

      {/* Notice Dialog */}
      <NoticeDialog 
        open={showNoticeDialog} 
        onOpenChange={setShowNoticeDialog} 
      />
            
      {/* Notice Dialog */}
      {/* <NoticeDialog 
                open={showNoticeDialog} 
                onOpenChange={setShowNoticeDialog} 
            /> */}
    </>
  )
}

export default Home