// src/components/SEO.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

// Social profiles
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064182843841';
const INSTAGRAM_URL = 'https://www.instagram.com/netaniadelaiya/';
const SITE_URL = 'https://www.netaniadelaiya.com';

export default function SEO({
  title,
  description,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
  keywords,
  author = 'Netania De Laiya Resort'
}) {
  const location = useLocation();
  
  // Default SEO values
  const defaultTitle = 'Netania De Laiya - Beachfront Resort in Laiya, Batangas';
  const defaultDescription = 'Beachfront resort in Laiya, San Juan, Batangas with pool and hotel-like rooms. Book Netania De Laiya today for your perfect beach getaway.';
  const defaultImage = `${SITE_URL}/og-home.jpg`;
  const defaultKeywords = 'Netania De Laiya, Laiya resort, Batangas resort, beachfront resort, beach hotel, Philippines resort, San Juan Batangas, pool resort';
  
  const siteName = 'Netania De Laiya';
  const locale = 'en_PH';
  
  // Construct full URLs
  const canonical = `${SITE_URL}${location.pathname}`;
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;
  const finalKeywords = keywords || defaultKeywords;
  
  // Generate structured data for resort
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "Netania De Laiya",
    "description": finalDescription,
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.jpg`,
    "image": finalImage,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Juan",
      "addressRegion": "Batangas",
      "addressCountry": "Philippines"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "13.7565",
      "longitude": "121.3972"
    },
    "telephone": "+63 949 798 9831",
    "priceRange": "$$",
    "amenityFeature": [
      {"@type": "LocationFeatureSpecification", "name": "Swimming Pool"},
      {"@type": "LocationFeatureSpecification", "name": "Beach Access"},
      {"@type": "LocationFeatureSpecification", "name": "Restaurant"},
      {"@type": "LocationFeatureSpecification", "name": "Free WiFi"}
    ],
    "sameAs": [FACEBOOK_URL, INSTAGRAM_URL]
  };

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#0ea5e9" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card (enabled) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      
      {/* Social Profiles */}
      <meta property="og:see_also" content={FACEBOOK_URL} />
      <meta property="og:see_also" content={INSTAGRAM_URL} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}

      {/* Structured Data - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(jsonLd || defaultJsonLd, null, 2) 
        }}
      />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    </>
  );
}

