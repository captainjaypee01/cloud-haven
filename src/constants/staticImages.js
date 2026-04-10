/**
 * Long-lived marketing assets served from /public/images (same origin as the site).
 * Use these instead of Cloudinary for rarely changing images to save bandwidth/transform quota.
 */
export const SITE_ORIGIN = 'https://www.netaniadelaiya.com';

export const STATIC_IMG = {
    bgCover: '/images/bg-cover.jpg',
    logo: '/images/netania-logo.jpg',
    policyHero: '/images/policy-1_b6xkhg.jpg',
    contact1: '/images/contact-1.jpg',
    contact2: '/images/contact-2.jpg',
    aboutUs1: '/images/about-us-1.jpg',
    aboutUs2: '/images/about-us-2.jpg',
    aboutUs3: '/images/about-us-3.jpg',
    aboutUs5: '/images/about-us-5.jpg',
    offerFallback: '/images/background2.jpg',
    notice: '/images/notice-1.jpg',
    scamFacebook: '/images/ScamFacebook.png',
    roomsOg: '/images/pv-1.jpg',
};

/** Absolute URL for og:image, JSON-LD, and social meta */
export function staticImgAbsolute(path) {
    if (!path) return path;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${SITE_ORIGIN}${path}`;
    return `${SITE_ORIGIN}/${path}`;
}
