// src/pages/AboutUs.jsx
import React from "react";
import SEO from "@/components/SEO";
import {
    Carousel,
    CarouselContent,
    CarouselItem
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ABOUT_US_CAROUSEL_IMAGES } from "@/constants/about-us";

const AboutUs = () => {
    const images = ABOUT_US_CAROUSEL_IMAGES;  // using existing room images for the hero carousel

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO
                title="About Netania De Laiya - Laiya Beach Resort"
                description="Discover the story behind Netania De Laiya, a family-owned beachfront resort in Laiya, San Juan, Batangas. Experience our commitment to providing affordable luxury with beach access, swimming pool, and hotel-style accommodations for unforgettable family vacations."
                canonical={typeof window !== 'undefined' ? window.location.origin + '/about-us' : 'https://www.netaniadelaiya.com/about-us'}
                og={{ url: 'https://www.netaniadelaiya.com/about-us' }}
                jsonLd={{
                  '@context': 'https://schema.org',
                  '@type': 'Resort',
                  name: 'Netania De Laiya',
                  url: 'https://www.netaniadelaiya.com/about-us',
                  sameAs: [
                    'https://www.facebook.com/profile.php?id=100064182843841',
                    'https://www.instagram.com/netaniadelaiya/'
                  ],
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
                    addressLocality: 'San Juan',
                    addressRegion: 'Batangas',
                    addressCountry: 'PH'
                  },
                  hasAmenityFeature: [
                    { '@type': 'LocationFeatureSpecification', name: 'Beachfront access' },
                    { '@type': 'LocationFeatureSpecification', name: 'Swimming pool' },
                    { '@type': 'LocationFeatureSpecification', name: 'Hotel-style rooms' }
                  ]
                }}
            />
            {/* Hero Section */}
            <div className="relative w-full">
                <Carousel className="h-screen w-full" opts={{ loop: true, align: "center" }} plugins={[Autoplay({ delay: 3000, playOnInit: true })]}>
                    <CarouselContent>
                        {images.map((url, idx) => (
                            <CarouselItem key={idx}>
                                <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: `url('${url}')` }} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
                {/* Hero Title Overlay */}
                <div className="absolute top-1/2 w-full text-center px-4 -translate-y-1/2">
                    <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">About Us</h1>
                </div>
            </div>

            {/* About Content */}
            <div className="relative z-10 max-w-4xl mx-auto py-16 px-4 md:px-8 lg:px-0 text-gray-800">
                <h2 className="text-3xl font-semibold mb-6">Who We Are</h2>
                <p className="mb-4 text-lg">
                    **Netania De Laiya** is a family-friendly resort dedicated to providing a serene and memorable getaway experience. Located in the scenic hills of Rizal, our offers a tranquil escape from the city’s hustle, complete with breathtaking mountain views and a cozy, inviting atmosphere. We pride ourselves on being one of the most affordable destinations in the area, without compromising on comfort or quality.
                </p>
                <p className="mb-4 text-lg">
                    Since our inception, we’ve focused on creating an oasis where guests can relax and make lasting memories. Our facilities include modern transient rooms, a swimming pool with panoramic views, and an on-site restaurant offering local cuisine. Whether you’re seeking a quiet retreat or an adventure with nearby tourist attractions, Netania De Laiya has something for everyone.
                </p>
                <p className="mb-4 text-lg">
                    In fact, we offer packages of up to 22 hours for as low as ₱1,599 – an unbeatable deal that has made us popular among budget-conscious travelers. From couples looking for a romantic escape to families and friends planning a fun-filled outing, our resort is designed to be your <em>“haven above the clouds”</em>, where enjoyment and relaxation meet.
                </p>
                <h2 className="text-3xl font-semibold mt-10 mb-6">Our Mission & Vision</h2>
                <p className="mb-4 text-lg">
                    Our mission is simple: to deliver a <strong>cloud-nine experience</strong> to every guest. We believe that a great vacation doesn’t have to be expensive, so we strive to offer exceptional value – comfortable accommodations, friendly service, and beautiful surroundings – at a price that everyone can afford. We aim to be <span className="italic">“Boracay’s cheapest”</span> that leaves you feeling rich in memories and experiences.
                </p>
                <p className="mb-4 text-lg">
                    As we grow, our vision is to become a top choice for in Rizal, known for our hospitality and the unique personal touches we provide. We continuously improve our amenities and services based on guest feedback, ensuring that Netania De Laiya remains your go-to haven whenever you need a break above the clouds.
                </p>
            </div>
        </div>
    );
};

export default AboutUs;
