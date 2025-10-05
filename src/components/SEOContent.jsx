import React from 'react'

const SEOContent = () => {
    return (
        <section className="py-16 bg-white mt-20">
            <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                            Discover Paradise at Netania De Laiya
                        </h2>
                        <p className="text-lg text-gray-700 mb-6">
                            Nestled along the pristine shores of Laiya, San Juan, Batangas, Netania De Laiya offers an unparalleled beachfront resort experience. Our luxury accommodations combine modern comfort with breathtaking ocean views, creating the perfect setting for your dream vacation.
                        </p>
                        <p className="text-lg text-gray-700 mb-6">
                            Whether you're planning a romantic getaway, family vacation, or corporate retreat, our resort provides the ideal backdrop for unforgettable memories. With direct beach access, a stunning swimming pool, and world-class amenities, we ensure every guest experiences the ultimate in relaxation and luxury.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-amber-50 p-8 rounded-2xl">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Netania De Laiya?</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-3">✓</span>
                                <span className="text-gray-700">Direct beachfront access with pristine white sand</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-3">✓</span>
                                <span className="text-gray-700">Luxury hotel-quality rooms with modern amenities</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-3">✓</span>
                                <span className="text-gray-700">Crystal-clear swimming pool with ocean views</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-3">✓</span>
                                <span className="text-gray-700">On-site restaurant serving fresh cuisine</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-amber-500 mr-3">✓</span>
                                <span className="text-gray-700">Free WiFi and modern conveniences</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SEOContent
