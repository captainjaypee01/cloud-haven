import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRoomImageUrl, getThumbnailUrl, getOptimizedImage } from '@/utils/imageOptimization';

/**
 * Room Gallery Slider Component using Embla Carousel
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.images - Array of image URLs
 * @param {string} props.roomName - Room name for alt text
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.aspectRatio - Aspect ratio for images (width/height)
 * @param {boolean} props.showThumbnails - Whether to show thumbnail navigation
 * @param {boolean} props.loop - Whether to enable loop
 * @param {boolean} props.autoPlay - Whether to enable auto play
 * @param {number} props.autoPlayDelay - Auto play delay in milliseconds
 * 
 * @returns {JSX.Element} The gallery slider component
 */
export const RoomGallerySlider = ({
    images = [],
    roomName = 'Room',
    className = '',
    aspectRatio = 16/9,
    showThumbnails = true,
    loop = true,
    autoPlay = false,
    autoPlayDelay = 3000,
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop,
        align: 'start',
        draggable: true
    });
    const [thumbsRef, thumbsApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true,
        axis: 'x'
    });
    
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState([]);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    // Auto play functionality
    useEffect(() => {
        if (!autoPlay || !emblaApi) return;

        const autoPlayInterval = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else if (loop) {
                emblaApi.scrollTo(0);
            }
        }, autoPlayDelay);

        return () => clearInterval(autoPlayInterval);
    }, [emblaApi, autoPlay, autoPlayDelay, loop]);

    // Update carousel state
    const updateCarouselState = useCallback(() => {
        if (!emblaApi) return;
        
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    // Initialize carousel
    useEffect(() => {
        if (!emblaApi) return;
        
        setScrollSnaps(emblaApi.scrollSnapList());
        updateCarouselState();
        
        emblaApi.on('select', updateCarouselState);
        emblaApi.on('reInit', updateCarouselState);

        return () => {
            emblaApi.off('select', updateCarouselState);
            emblaApi.off('reInit', updateCarouselState);
        };
    }, [emblaApi, updateCarouselState]);

    // Navigation handlers
    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback((index) => {
        if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    // Thumbnail click handler
    const onThumbClick = useCallback((index) => {
        if (!emblaApi || !thumbsApi) return;
        
        scrollTo(index);
        thumbsApi.scrollTo(index);
    }, [emblaApi, thumbsApi, scrollTo]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                scrollPrev();
            } else if (e.key === 'ArrowRight') {
                scrollNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [scrollPrev, scrollNext]);

    if (!images.length) {
        return (
            <div 
                className={`w-full bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
                style={{ aspectRatio }}
            >
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Main Carousel */}
            <div className="relative">
                <div className="overflow-hidden rounded-lg" ref={emblaRef}>
                    <div className="flex">
                        {images.map((src, index) => {
                            const optimizedImage = getOptimizedImage(src, {
                                sizes: [
                                    { width: 'w_400', descriptor: '400w' },
                                    { width: 'w_800', descriptor: '800w' },
                                    { width: 'w_1200', descriptor: '1200w' }
                                ]
                            });
                            
                            return (
                                <div 
                                    key={index} 
                                    className="flex-[0_0_100%] min-w-0"
                                    style={{ aspectRatio }}
                                >
                                    <img
                                        src={optimizedImage.src}
                                        srcSet={optimizedImage.srcSet}
                                        sizes={optimizedImage.sizes}
                                        alt={`${roomName} at Netania De Laiya beachfront resort in Laiya, Batangas - Photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        loading={index === 0 ? "eager" : "lazy"}
                                        decoding="async"
                                        width={typeof aspectRatio === 'number' ? Math.round(1200) : undefined}
                                        height={typeof aspectRatio === 'number' ? Math.round(1200 / aspectRatio) : undefined}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 cursor-pointer"
                            onClick={scrollPrev}
                            disabled={!canScrollPrev && !loop}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 cursor-pointer"
                            onClick={scrollNext}
                            disabled={!canScrollNext && !loop}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}

                {/* Dots Indicator */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {scrollSnaps.map((_, index) => (
                            <Button
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                                    index === selectedIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                onClick={() => scrollTo(index)}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {showThumbnails && images.length > 1 && (
                <div className="mt-4">
                    <div className="overflow-hidden" ref={thumbsRef}>
                        <div className="flex gap-2">
                            {images.map((src, index) => (
                                <div
                                    key={index}
                                    className={`flex-[0_0_auto] w-16 h-12 rounded cursor-pointer border-2 transition-colors ${ 
                                        index === selectedIndex ? 'border-blue-500' : 'border-transparent'
                                    }`}
                                    onClick={() => onThumbClick(index)}
                                >
                                    <img
                                        src={getThumbnailUrl(src, 80)}
                                        alt={`${roomName} thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover rounded"
                                        loading="lazy"
                                        decoding="async"
                                        width={80}
                                        height={60}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {selectedIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};
