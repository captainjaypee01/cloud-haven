import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from '@/components/ui/carousel';
import { AlertTriangle } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_ALT } from '@/constants/AppConstant';

const ScamAwarenessDialog = ({ open, onOpenChange }) => {
    // Array of scam awareness images - can be easily expanded
    const scamImages = [
        {
            id: 1,
            url: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1761462590/scam-fb-2.png',
            alt: 'Scam Facebook Page Warning 1'
        },
        {
            id: 2,
            url: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1759040551/scam-fb-1.png',
            alt: 'Scam Facebook Page Warning 2'
        }
        // More images can be added here as they become available
    ];

    // Custom close handler that only allows closing via the "I Understand" button
    const handleClose = () => {
        onOpenChange(false);
    };

    // Don't show dialog if no images available
    if (!open || scamImages.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent 
                className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] sm:w-[95vw] sm:max-w-5xl sm:h-auto sm:max-h-[90vh] mx-auto p-0 flex flex-col overflow-hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                {/* Header - Fixed at top */}
                <DialogHeader className="text-center pb-4 px-6 pt-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 flex-shrink-0">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
                        <DialogTitle className="text-2xl sm:text-3xl font-bold text-red-600">
                            Important Security Notice
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-700 text-base sm:text-lg">
                        Please read this important information about fake Facebook pages
                    </DialogDescription>
                </DialogHeader>

                {/* Body - Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                    <div className="space-y-4">
                        {/* Warning Message */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-800 mb-2">
                                        Scam Alert: Fake Facebook Pages
                                    </h3>
                                    <p className="text-red-700 text-sm sm:text-base leading-relaxed">
                                        We have been made aware that there are fake Facebook pages using our name and logo 
                                        to deceive customers. These scam pages may try to collect personal information, 
                                        payment details, or offer fake bookings.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Image Carousel */}
                        <div className="relative">
                            <div className="mb-3 text-center">
                                <p className="text-sm text-gray-600">
                                    <span className="inline-flex items-center gap-1">
                                        <span>Click on the image to view in full size</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </span>
                                </p>
                            </div>
                            <Carousel 
                                opts={{ loop: true, align: "center" }} 
                                className="w-full"
                                plugins={[
                                    Autoplay({
                                        delay: 4000, // 4 seconds per slide
                                        playOnInit: true,
                                        stopOnInteraction: false,
                                        stopOnMouseEnter: true,
                                        stopOnFocusIn: false,
                                    }),
                                ]}
                            >
                                <CarouselContent>
                                    {scamImages.map((image) => (
                                        <CarouselItem key={image.id} className="h-80 sm:h-96 md:h-[500px] lg:h-[600px]">
                                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={image.url}
                                                    alt={image.alt}
                                                    className="w-full h-full object-contain cursor-zoom-in"
                                                    loading="lazy"
                                                    onClick={() => window.open(image.url, '_blank')}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                
                                {/* Navigation arrows - only show if more than 1 image */}
                                {scamImages.length > 1 && (
                                    <>
                                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg" />
                                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg" />
                                    </>
                                )}
                            </Carousel>

                            {/* Slide indicators - only show if more than 1 image */}
                            {scamImages.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {scamImages.map((_, index) => (
                                        <div
                                            key={index}
                                            className="w-2 h-2 rounded-full bg-gray-300"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Safety Tips */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-3">
                                How to Identify Our Official Page:
                            </h3>
                            <ul className="space-y-2 text-blue-700 text-sm sm:text-base">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>Our official Facebook page URL: <a 
                                        href="https://facebook.com/profile.php?id=100064182843841" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline font-bold"
                                    >
                                        facebook.com/profile.php?id=100064182843841
                                    </a></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>Always verify the page URL before making any bookings or payments</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>Our official website is: <a 
                                        href="https://www.netaniadelaiya.com" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline font-bold"
                                    >
                                        www.netaniadelaiya.com
                                    </a></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span>For bookings, always use our official website or contact us directly</span>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-800 mb-3">
                                Need Help or Have Questions?
                            </h3>
                            <p className="text-green-700 text-sm sm:text-base mb-3">
                                If you encounter any suspicious pages or have concerns, please contact us directly:
                            </p>
                            <div className="space-y-2 text-green-700 text-sm sm:text-base">
                                <p><strong>Phone:</strong> <a 
                                    href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    {SUPPORT_PHONE}
                                </a></p>
                                <p><a 
                                    href={`tel:${SUPPORT_PHONE_ALT.replace(/\s/g, '')}`}
                                    className="text-green-600 hover:text-green-800 underline ml-[56px]"
                                >
                                    {SUPPORT_PHONE_ALT}
                                </a></p>
                                <p><strong>Website:</strong> <a 
                                    href="https://www.netaniadelaiya.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    www.netaniadelaiya.com
                                </a></p>
                                <p><strong>Email:</strong> <a 
                                    href={`mailto:${SUPPORT_EMAIL}`}
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    {SUPPORT_EMAIL}
                                </a></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <DialogFooter className="pt-4 px-6 pb-6 bg-white border-t border-gray-100 flex-shrink-0 flex flex-row justify-end gap-2">
                    <Button 
                        variant="outline" 
                        className="w-auto px-6"
                        onClick={handleClose}
                    >
                        I Understand
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ScamAwarenessDialog;
