// src/components/SEO.jsx
import React from 'react';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { useLocation } from 'react-router-dom';

// Social profiles
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064182843841';
const INSTAGRAM_URL = 'https://www.instagram.com/netaniadelaiya/';
const SITE_URL = 'https://www.netaniadelaiya.com';

export default function SEO({
  title,
  description,
  image,
  og,
  type = 'website',
  noindex = false,
  jsonLd,
  keywords,
  author = 'Netania De Laiya Resort'
}) {
  const location = useLocation();
  
  // Default SEO values
  const defaultTitle = 'Beachfront Resort Laiya Batangas | Netania De Laiya';
  const defaultDescription = 'Discover paradise at Netania De Laiya - a beachfront resort in Laiya, San Juan, Batangas. Premium accommodations with direct beach access, stunning infinity pool, and exceptional service.';
  const defaultImage = `${SITE_URL}/logo.jpg`;
  const defaultKeywords = 'Netania De Laiya, Laiya resort, Batangas resort, beachfront resort, beach hotel, Philippines resort, San Juan Batangas, pool resort, premium accommodation, family vacation, romantic getaway';
  
  const siteName = 'Netania De Laiya';
  const locale = 'en_PH';
  
  // Construct full URLs
  const canonical = `${SITE_URL}${location.pathname}`;
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  // Prefer explicit image prop, otherwise allow legacy og.image if provided
  const providedImage = image || (og && og.image) || null;
  const baseImage = providedImage || defaultImage;
  // If Cloudinary, transform for OG/Twitter card size 1200x630
  const finalImage = baseImage && baseImage.includes('res.cloudinary.com')
    ? getOptimizedImageUrl(baseImage, { width: 'w_1200', height: 'h_630', crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto', responsive: false })
    : baseImage;
  const finalKeywords = keywords || defaultKeywords;
  
  // Generate comprehensive structured data for sitelinks
  const defaultJsonLd = [
    // Website schema for sitelinks
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Netania De Laiya",
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Netania De Laiya",
        "logo": `${SITE_URL}/logo.jpg`
      }
    },
    // Hotel/LodgingBusiness schema
    {
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": "Netania De Laiya",
      "description": finalDescription,
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.jpg`,
      "image": finalImage,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Laiya, San Juan",
        "addressLocality": "San Juan",
        "addressRegion": "Batangas",
        "addressCountry": "Philippines",
        "postalCode": "4226"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "13.7565",
        "longitude": "121.3972"
      },
      "telephone": "+63 949 798 9831",
      "priceRange": "$$",
      "starRating": {
        "@type": "Rating",
        "ratingValue": "4.5",
        "bestRating": "5"
      },
      "amenityFeature": [
        {"@type": "LocationFeatureSpecification", "name": "Swimming Pool"},
        {"@type": "LocationFeatureSpecification", "name": "Beach Access"},
        {"@type": "LocationFeatureSpecification", "name": "Restaurant"},
        {"@type": "LocationFeatureSpecification", "name": "Free WiFi"},
        {"@type": "LocationFeatureSpecification", "name": "Parking"},
        {"@type": "LocationFeatureSpecification", "name": "Air Conditioning"}
      ],
      "sameAs": [FACEBOOK_URL, INSTAGRAM_URL],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Accommodations and Day Tours",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Accommodations",
              "url": `${SITE_URL}/rooms`
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Day Tour",
              "url": `${SITE_URL}/day-tour`
            }
          }
        ]
      }
    },
    // Organization schema
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Netania De Laiya",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.jpg`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+63 949 798 9831",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"]
      },
      "sameAs": [FACEBOOK_URL, INSTAGRAM_URL]
    }
  ];

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            overflow-x: hidden;
            max-width: 100vw;
            width: 100%;
          }
          body {
            position: relative;
          }
          #root {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
            overflow-y: visible;
          }
          * {
            box-sizing: border-box;
          }
        `
      }} />
      <meta name="theme-color" content="#0ea5e9" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Hreflang tags for international SEO */}
      <link rel="alternate" hrefLang="en-ph" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

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
      
      {/* PWA Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      
      {/* Additional performance optimizations */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Netania De Laiya" />
    </>
  );
}

