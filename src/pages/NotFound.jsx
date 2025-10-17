import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, MapPin, Calendar, Phone } from 'lucide-react';
import SEO from '@/components/SEO';
import { SUPPORT_EMAIL } from '@/constants/AppConstant';

const NotFound = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to rooms page with search query
            navigate(`/rooms?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const popularPages = [
        {
            title: 'Rooms & Suites',
            description: 'Browse our comfortable accommodations',
            link: '/rooms',
            icon: <MapPin className="w-5 h-5" />
        },
        {
            title: 'Book Now',
            description: 'Make a reservation for your stay',
            link: '/?book=true',
            icon: <Calendar className="w-5 h-5" />
        },
        {
            title: 'Contact Us',
            description: 'Get in touch with our team',
            link: '/contact-us',
            icon: <Phone className="w-5 h-5" />
        }
    ];

    return (
        <>
            <SEO
                title="Page Not Found | Netania De Laiya"
                description="The page you're looking for doesn't exist. Find premium accommodations, make bookings, or contact Netania De Laiya - a beachfront resort in Laiya, San Juan, Batangas with exceptional service."
                canonical={typeof window !== 'undefined' ? window.location.origin + '/404' : 'https://www.netaniadelaiya.com/404'}
                noindex={true}
                og={{
                    title: 'Page Not Found | Netania De Laiya',
                    description: 'The page you\'re looking for doesn\'t exist. Find premium accommodations, make bookings, or contact Netania De Laiya - a beachfront resort in Laiya, San Juan, Batangas with exceptional service.',
                    image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1756913943/policy-1_b6xkhg.jpg',
                    url: 'https://www.netaniadelaiya.com/404',
                    type: 'website',
                    locale: 'en_PH',
                    siteName: 'Netania De Laiya'
                }}
            />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 mt-16">
                <div className="max-w-2xl mx-auto text-center">
                    {/* 404 Illustration */}
                    <div className="mb-8">
                        <div className="text-8xl md:text-9xl font-bold text-blue-100 mb-4">
                            404
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent text-4xl md:text-5xl font-bold opacity-20">
                                OOPS!
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb- pt-24">
                                Page Not Found
                            </h1>
                        </div>
                    </div>

                    {/* Error Message */}
                    <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                        The page you're looking for seems to have washed away with the tide.
                        Let's help you find your way back to paradise.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="Search for rooms, amenities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12"
                                />
                            </div>
                            <Button type="submit" className="h-12 px-6">
                                Search
                            </Button>
                        </div>
                    </form>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <Button asChild size="lg" className="mr-4 mb-4">
                            <Link to="/">
                                <Home className="w-5 h-5 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="mb-4">
                            <Link to="/rooms">
                                View Rooms
                            </Link>
                        </Button>
                    </div>

                    {/* Popular Pages */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {popularPages.map((page, index) => (
                            <Link
                                key={index}
                                to={page.link}
                                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                                    {page.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{page.title}</h3>
                                <p className="text-sm text-gray-600">{page.description}</p>
                            </Link>
                        ))}
                    </div>

                    {/* Contact Info */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-600 mb-4">
                            Still can't find what you're looking for?
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
                            <a href="tel:+639497989831" className="hover:text-blue-600 transition-colors">
                                📞 +63 949 798 9831
                            </a>
                            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-blue-600 transition-colors">
                                ✉️ {SUPPORT_EMAIL}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotFound;
