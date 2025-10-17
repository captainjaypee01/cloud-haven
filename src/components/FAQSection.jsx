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
            answer: "We offer premium accommodations with refined amenities, available in three room types: Beach View, Pool Access, and Garden View. Each room is designed for comfort and convenience, with options suitable for 2 pax and our largest units accommodating 4 to 6 pax."
        },
        {
            question: "Do you have a swimming pool?",
            answer: "Yes, our iconic dark blue infinity pool, featuring crystal-clear water and stunning ocean views, is a favorite spot for guests to capture their most Instagram-worthy moments."
        },
        {
            question: "Is there a restaurant on-site?",
            answer: "We have an in-house restaurant, offering a range of food options, including starters, main courses and desserts. Guests can order food anytime between 7:00 AM and 7:00 PM."
        },
        {
            question: "What activities are available at the resort?",
            answer: "Guests may indulge in our infinity pool, engage in water activities, experience body massages, enjoy beverages at the bar, or simply relax while appreciating the scenery."
        },
        {
            question: "Is WiFi available?",
            answer: "Yes, we provide WiFi in all rooms and throughout the resort’s common areas, perfect for guests working remotely or those who simply wish to stay connected."
        },
        {
            question: "How do I make a reservation?",
            answer: "Reservations can be made through our official website. A 50% down payment is required to confirm and secure your booking. \nFor corporate inquiries and bookings, please send your details to our contact email below. "
        },
        {
            question: "What is your cancellation policy?",
            answer: "Rescheduling requests must be made at least 7 days prior to the original check-in date.\n\nPlease note that payments are strictly non-refundable. However, guests may reschedule their stay within 30 days of the original booking date, subject to availability."
        },
        {
            question: "Are you pet-friendly?",
            answer: "Yes, we allow pets inside the resort, provided they meet the requirements of our pet policy."
        },
        {
            question: "Are we allowed to bring food and drinks?",
            answer: "Day tour guests may bring outside food and drinks at no extra charge. For overnight stays, main meals are not permitted as we encourage dining at our in-house restaurant. However, light snacks and drinks are allowed free of charge. Kindly note that a corkage fee applies should you wish to bring lechon."
        },
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
                            href="#" 
                            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            onClick={(e) => {
                                e.preventDefault();
                                const email = 'netaniadelaiya' + '@' + 'gmail.com';
                                window.location.href = 'mailto:' + email;
                            }}
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
