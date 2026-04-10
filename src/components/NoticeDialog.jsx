import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Info } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import OptimizedImage from '@/components/common/OptimizedImage';
import { STATIC_IMG } from '@/constants/staticImages';

const NoticeDialog = ({ open, onOpenChange }) => {
    // Array of notice images - can be easily expanded
    const noticeImages = [
        {
            id: 1,
            url: STATIC_IMG.notice,
            alt: 'Speaker Policy Notice'
        },
        // More images can be added here as they become available
    ];

    // Custom close handler that only allows closing via the "I Understand" button
    const handleClose = () => {
        onOpenChange(false);
    };

    // Don't show dialog if no images available
    if (!open || noticeImages.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent 
                className="w-[95vw] max-w-5xl h-[90vh] max-h-[90vh] sm:h-[85vh] sm:max-h-[85vh] mx-auto p-0 flex flex-col"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                {/* Header - Fixed at top */}
                <DialogHeader className="text-center py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b-4 border-amber-700 flex-shrink-0">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <Info className="h-5 w-5 sm:h-7 sm:w-7 text-amber-700" />
                        <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900 uppercase">
                            Notice
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Body - Image Carousel - Takes most of the space */}
                <div 
                    className="flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-2 sm:py-4"
                    style={{ 
                        minHeight: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Click hint - only show on desktop */}
                    <div className="mb-2 text-center hidden sm:block" style={{ flexShrink: 0, height: '20px' }}>
                        <p className="text-xs text-gray-500">
                            Click on the image to view in full size
                        </p>
                    </div>
                    
                    {/* Image container - takes remaining space */}
                    <div 
                        className="relative w-full"
                        style={{ 
                            flex: '1 1 auto',
                            minHeight: 0,
                            height: 0, // Force flex to calculate
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Carousel 
                            opts={{ loop: true, align: "center" }} 
                            className="w-full"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
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
                            <CarouselContent className="h-full -ml-0" style={{ height: '100%', flex: '1 1 auto' }}>
                                {noticeImages.map((image) => (
                                    <CarouselItem 
                                        key={image.id} 
                                        className="pl-0"
                                        style={{ height: '100%', display: 'flex' }}
                                    >
                                        <div 
                                            className="relative w-full rounded-lg bg-gray-100 flex items-center justify-center"
                                            style={{ 
                                                padding: '8px',
                                                width: '100%',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.alt}
                                                className="cursor-zoom-in"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    width: 'auto',
                                                    height: 'auto',
                                                    objectFit: 'contain',
                                                    display: 'block'
                                                }}
                                                loading="lazy"
                                                onClick={() => window.open(image.url, '_blank')}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            
                            {/* Navigation arrows - only show if more than 1 image */}
                            {noticeImages.length > 1 && (
                                <>
                                    <CarouselPrevious className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg z-10 h-8 w-8 sm:h-10 sm:w-10" />
                                    <CarouselNext className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg z-10 h-8 w-8 sm:h-10 sm:w-10" />
                                </>
                            )}
                        </Carousel>
                    </div>

                    {/* Slide indicators - only show if more than 1 image */}
                    {noticeImages.length > 1 && (
                        <div className="flex justify-center gap-2 mt-2 sm:mt-4" style={{ flexShrink: 0, height: '20px' }}>
                            {noticeImages.map((_, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                <DialogFooter className="py-3 sm:py-4 px-4 sm:px-6 bg-white border-t border-gray-100 flex-shrink-0 flex flex-row justify-center">
                    <Button 
                        variant="outline" 
                        className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base"
                        onClick={handleClose}
                    >
                        I Understand
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NoticeDialog;
