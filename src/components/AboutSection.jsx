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
                    Located in the heart of Laiya, San Juan, Batangas, the resort offers excellent service, warm hospitality, and modern comforts and facilities, all set against the serene beauty of Laiya’s shores.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏖️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Beachfront Location</h3>
                        <p className="text-gray-600">
                            Direct access to Laiya’s pristine white sand beach, perfect for swimming, sunbathing and enjoying a variety of water activities.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl"><HotelIcon /></span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Accommodations</h3>
                        <p className="text-gray-600">
                            Three spacious room types, each featuring a full range of in-room amenities for a premium stay experience.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🍽️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Dining Excellence</h3>
                        <p className="text-gray-600">
                            Thoughtfully prepared to delight every palate, our dishes embody the quality and care that define our dining experience.
                        </p>
                    </div>
                </div>

                <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect for Every Occasion</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Family Vacations</h4>
                            <p className="text-gray-600 mb-4">
                                Create lasting memories with your loved ones in our family-friendly setting. Our spacious accommodations and safe beach access make us the perfect choice for guests of all ages, including their furry companions
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Romantic Getaways</h4>
                            <p className="text-gray-600 mb-4">
                                Experience a romantic escape at our resort, with scenic beachfront views, photo-worthy spaces, and inviting settings ideal for couples to connect and unwind.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Corporate Retreats</h4>
                            <p className="text-gray-600 mb-4">
                                Host your company’s next outing at our beachfront resort, offering versatile spaces and accommodations that let your corporate activities unfold seamlessly by the beach.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Special Events</h4>
                            <p className="text-gray-600 mb-4">
                                Designed for wedding prenup shoots at present, our resort will soon be ready to host a wide range of special occasions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutSection
