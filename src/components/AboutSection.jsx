import { Hotel, HotelIcon } from 'lucide-react'
import React from 'react'

const AboutSection = () => {
    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        About Netania De Laiya Resort
                    </h2>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Located in the heart of Laiya, San Juan, Batangas, our resort has been providing exceptional beachfront hospitality for discerning travelers seeking the perfect blend of luxury and natural beauty.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏖️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Beachfront Location</h3>
                        <p className="text-gray-600">
                            Direct access to Laiya's pristine white sand beaches, perfect for swimming, sunbathing, and water activities.
                        </p>
                    </div>
                    
                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl"><HotelIcon /></span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Accommodations</h3>
                        <p className="text-gray-600">
                            Spacious, well-appointed rooms with modern amenities, air conditioning, and stunning ocean or garden views.
                        </p>
                    </div>
                    
                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🍽️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Dining Excellence</h3>
                        <p className="text-gray-600">
                            Fresh cuisine prepared by our skilled chefs, featuring delicious meals and regional specialties.
                        </p>
                    </div>
                </div>
                
                <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect for Every Occasion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Family Vacations</h4>
                            <p className="text-gray-600 mb-4">
                                Create lasting memories with your loved ones in our family-friendly environment. Our spacious accommodations and safe beach access make us the perfect choice for families with children of all ages.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Romantic Getaways</h4>
                            <p className="text-gray-600 mb-4">
                                Rekindle romance with your partner in our intimate setting. Enjoy sunset views, private beach access, and our special couples' packages designed for unforgettable moments.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Corporate Retreats</h4>
                            <p className="text-gray-600 mb-4">
                                Host your next business meeting or team building event in our professional yet relaxed environment. We offer meeting facilities and group accommodations for corporate groups.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Special Events</h4>
                            <p className="text-gray-600 mb-4">
                                Our beautiful beachfront setting provides the perfect backdrop for prenup photography sessions. We welcome couples to use our resort as a venue for their special pre-wedding photoshoots.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutSection
