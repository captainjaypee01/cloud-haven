// src/components/SEO.jsx
import React from 'react';

// Social profiles
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064182843841';
const INSTAGRAM_URL = 'https://www.instagram.com/netaniadelaiya/';

export default function Seo({
  title,
  description,
  canonical,
  og = {},
  noindex = false,
  jsonLd,
}) {
  const siteName = og.siteName || 'Netania De Laiya';
  const locale = og.locale || 'en_PH';
  const ogTitle = og.title || title;
  const ogDescription = og.description || description;
  const ogImage = og.image;
  const ogType = og.type || 'website';
  const ogUrl = og.url || canonical;

  return (
    <>
      {title && <title>{title ? `${title} | ${siteName}` : siteName}</title>}

      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogType && <meta property="og:type" content={ogType} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {siteName && <meta property="og:site_name" content={siteName} />} 
      {locale && <meta property="og:locale" content={locale} />}
      {/* Link social profiles */}
      <meta property="og:see_also" content={FACEBOOK_URL} />
      <meta property="og:see_also" content={INSTAGRAM_URL} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}

