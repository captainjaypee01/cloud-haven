// src/pages/ContactUsPage.jsx
import React from "react";
import SEO from "@/components/SEO";
import {
    Carousel,
    CarouselContent,
    CarouselItem
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { roomPhotos } from "../data/rooms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    message: z.string().min(1, "Message is required"),
});

const ContactUsPage = () => {
    const images = roomPhotos;
    const form = useForm({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            message: ""
        }
    });

    const onSubmit = (values) => {
        console.log("Contact form submitted:", values);
        // Simulate successful submission (no backend yet)
        toast.success("Thank you! Your message has been sent.");
        form.reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO
                title="Contact Netania De Laiya"
                description="Contact our Laiya beachfront resort for bookings, inquiries, group reservations, and event venue availability. Call +63 949 798 9831 or email info@netaniadelaiya.com."
                canonical={typeof window !== 'undefined' ? window.location.origin + '/contact-us' : 'https://netaniadelaiya.com/contact-us'}
                og={{ url: 'https://netaniadelaiya.com/contact-us' }}
                jsonLd={{
                  '@context': 'https://schema.org',
                  '@type': 'LodgingBusiness',
                  name: 'Netania De Laiya',
                  url: 'https://netaniadelaiya.com/contact-us',
                  telephone: '+63 949 798 9831',
                  email: 'info@netaniadelaiya.com',
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Laiya-Aplaya, San Juan, Batangas',
                    addressLocality: 'San Juan',
                    addressRegion: 'Batangas',
                    addressCountry: 'PH'
                  },
                  sameAs: [
                    'https://www.facebook.com/profile.php?id=100064182843841',
                    'https://www.instagram.com/netaniadelaiya/'
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
                    <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">Contact Us</h1>
                </div>
            </div>

            {/* Contact Form & Info Section */}
            <div className="max-w-6xl mx-auto py-16 px-8 md:px-8 lg:px-0 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-white/80 shadow-md rounded-xl backdrop-blur-md p-8">
                    <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Write your message here..." rows={5} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full mt-3">Send Message</Button>
                        </form>
                    </Form>
                </div>
                {/* Contact Details */}
                <div className="text-gray-800">
                    <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                    <p className="mb-2"><strong>Phone:</strong> +63 949 798 9831</p>
                    <p className="mb-2"><strong>Email:</strong> info@netaniadelaiya.com</p>
                    <p className="mb-2"><strong>Address:</strong> Laiya-Aplaya,San Juan,Batangas, Batangas City, Philippines</p>
                    <p className="mb-2"><strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=100064182843841" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Netania De Laiya</a></p>
                    <p className="mb-2"><strong>Instagram:</strong> <a href="https://www.instagram.com/netaniadelaiya" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Netania De Laiya</a></p>
                    <p className="mt-6 text-sm text-gray-600">
                        We’d love to hear from you! Whether you have a question about our rooms, want to inquire about availability, or need help with anything else, feel free to reach out. You can also connect with us on our social media pages for the latest updates and promotions.
                    </p>
                </div>
            </div>
            <div className="max-w-6xl mx-auto py-16 px-8 md:px-8 lg:px-0 h-96 gap-12">
                <iframe src="https://storage.googleapis.com/maps-solutions-8l3748yx2v/locator-plus/29gp/locator-plus.html"
                    width="100%" height="100%"
                    style={{ border: 0 }}
                    loading="lazy">
                </iframe>
            </div>
        </div>
    );
};

export default ContactUsPage;
