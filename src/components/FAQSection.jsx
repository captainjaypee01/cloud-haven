import React, { useState } from 'react'

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null)

    const faqs = [
        {
            question: "Where is Netania De Laiya located?",
            answer: "Netania De Laiya is located in Laiya-Aplaya, San Juan, Batangas, Philippines. We are situated directly on the beachfront, offering stunning ocean views and easy access to the pristine white sand beaches of Laiya."
        },
        {
            question: "What types of accommodations do you offer?",
            answer: "We offer luxury hotel-quality rooms with modern amenities including air conditioning, private bathrooms, and beautiful ocean or garden views. Our accommodations are perfect for families, couples, and business travelers."
        },
        {
            question: "Do you have a swimming pool?",
            answer: "Yes, we have a beautiful swimming pool with crystal-clear water and stunning ocean views. The pool area is perfect for relaxation and recreation, offering a great alternative to beach activities."
        },
        {
            question: "Is there a restaurant on-site?",
            answer: "Yes, we have an on-site restaurant that serves fresh cuisine and regional specialties. Our skilled chefs prepare delicious meals using quality ingredients, ensuring a memorable dining experience."
        },
        {
            question: "What activities are available at the resort?",
            answer: "Guests can enjoy beach activities, swimming in our pool, dining at our restaurant, and relaxing in our beautiful surroundings. We're also close to various attractions in Batangas for day trips and excursions."
        },
        {
            question: "Is WiFi available?",
            answer: "Yes, we provide free WiFi throughout the resort, ensuring you can stay connected during your visit. The WiFi is available in all rooms and common areas."
        },
        {
            question: "How do I make a reservation?",
            answer: "You can make a reservation through our website by selecting your dates and room preferences. Our booking system is secure and easy to use, and you'll receive instant confirmation of your reservation."
        },
        {
            question: "What is your rescheduling policy?",
            answer: "We offer rescheduling options for your booking. You can reschedule your stay within 30 days of your original check-in date. Please contact us to arrange your new dates, subject to availability."
        }
    ]

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-gray-600">
                        Find answers to common questions about Netania De Laiya Resort
                    </p>
                </div>
                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg">
                            <button
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                                onClick={() => toggleFAQ(index)}
                            >
                                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                                    {faq.question}
                                </h3>
                                <span className={`text-2xl transition-transform duration-200 ${
                                    openIndex === index ? 'rotate-45' : ''
                                }`}>
                                    +
                                </span>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4">
                                    <p className="text-gray-600 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-12 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Still have questions?
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Contact us directly for personalized assistance with your booking or any other inquiries.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a 
                            href="tel:+639497989831" 
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            📞 Call Us: +63 949 798 9831
                        </a>
                        <a 
                            href="mailto:netaniadelaiya@gmail.com" 
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            ✉️ Email Us
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FAQSection
