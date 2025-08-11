// src/pages/Policies.jsx
import React from "react";
import SEO from "@/components/SEO";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { roomPhotos } from "../data/rooms";

const Policies = () => {
    // Handler for printing (prints the currently active tab content)
    const handlePrint = () => window.print();
    const images = roomPhotos;

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO
                title="Resort Policies"
                description="Read Netania De Laiya's policies: child policy, room and accommodation rules, pet policy, and resort reminders for a safe and enjoyable stay in Laiya."
                canonical={typeof window !== 'undefined' ? window.location.origin + '/policy' : 'https://netaniadelaiya.com/policy'}
                og={{ url: 'https://netaniadelaiya.com/policy' }}
                jsonLd={{
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is the child policy?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Children aged 7 and below are free of charge when sharing beds with parents. No extra beds or cribs provided.' }
                    },
                    {
                      '@type': 'Question',
                      name: 'What are the check-in and check-out times?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Check-in is at 3:00 PM and check-out is at 12:00 PM. Early check-in or late check-out depends on availability and may incur fees.' }
                    },
                    {
                      '@type': 'Question',
                      name: 'Are pets allowed?',
                      acceptedAnswer: { '@type': 'Answer', text: 'Small pets (up to 10 kg) are allowed in designated rooms only and may incur a cleaning fee. Pets must be leashed in common areas.' }
                    }
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
                    <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">Resort Policies</h1>
                </div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto py-16 px-4 md:px-8 lg:px-0 text-gray-800">
                <h1 className="text-4xl font-bold text-center mb-2">Resort Policies</h1>
                <p className="text-center text-gray-600 mb-8">
                    Please review our policies before making a reservation.
                </p>
                <div className="max-w-4xl mx-auto">
                    <Tabs defaultValue="child" className="w-full">
                        <TabsList className="grid grid-cols-5 mb-6">
                            <TabsTrigger value="child">Child</TabsTrigger>
                            <TabsTrigger value="accommodation">Rooms</TabsTrigger>
                            <TabsTrigger value="resort">Resort</TabsTrigger>
                            <TabsTrigger value="reminders">Reminders</TabsTrigger>
                            <TabsTrigger value="pet">Pet</TabsTrigger>
                        </TabsList>
                        {/* Child Policy Content */}
                        <TabsContent value="child">
                            <div className="text-right mb-4">
                                <Button variant="secondary" onClick={handlePrint} className="cursor-pointer">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Children aged 7 and below are free of charge when sharing beds with parents. We do not provide extra beds or cribs.
                            </p>
                        </TabsContent>
                        {/* Room/Accommodation Policy Content */}
                        <TabsContent value="accommodation">
                            <div className="text-right mb-4">
                                <Button variant="secondary" onClick={handlePrint} className="cursor-pointer">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Check-in time is 3:00 PM and check-out time is 12:00 PM. Early check-in or late check-out is subject to availability and may incur charges.
                            </p>
                        </TabsContent>
                        {/* Resort Policy Content */}
                        <TabsContent value="resort">
                            <div className="text-right mb-4">
                                <Button variant="secondary" onClick={handlePrint} className="cursor-pointer">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Proper swimwear is required in the pool area. Outside food and beverages are not allowed within the resort premises.
                            </p>
                        </TabsContent>
                        {/* Reminders Content */}
                        <TabsContent value="reminders">
                            <div className="text-right mb-4">
                                <Button variant="secondary" onClick={handlePrint} className="cursor-pointer">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Quiet hours are from 10:00 PM to 7:00 AM. Please respect other guests by keeping noise to a minimum during these hours.
                            </p>
                        </TabsContent>
                        {/* Pet Policy Content */}
                        <TabsContent value="pet">
                            <div className="text-right mb-4">
                                <Button variant="secondary" onClick={handlePrint} className="cursor-pointer">
                                    <Printer className="w-4 h-4 mr-2" /> Print
                                </Button>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Small pets (up to 10 kg) are allowed in designated rooms only, with a cleaning fee per stay. Pets must be on a leash in common areas.
                            </p>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Policies;
