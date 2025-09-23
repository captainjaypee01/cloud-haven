import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, X, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const ExclusiveOffersDialog = ({ open, onOpenChange }) => {
    const api = useApi();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [copied, setCopied] = useState(false);

    const { data: offers, isLoading, error } = useQuery({
        queryKey: ['exclusiveOffers'],
        queryFn: async () => {
            const res = await api.get(`${API_PREFIX}/promos/exclusive`);
            return res.data?.data ?? [];
        },
        enabled: open // Only fetch when dialog is open
    });

    // Reset slide when dialog opens/closes
    useEffect(() => {
        if (open) {
            setCurrentSlide(0);
        }
    }, [open]);

    if (!open || isLoading || error || !offers || offers.length === 0) {
        return null;
    }

    const currentOffer = offers[currentSlide];

    const handleCopy = () => {
        navigator.clipboard.writeText(currentOffer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % offers.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length);
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
        });
    };

    const isPromoActive = (offer) => {
        const now = new Date();
        const startDate = offer.starts_at ? new Date(offer.starts_at) : null;
        const endDate = offer.ends_at ? new Date(offer.ends_at) : null;
        const expiryDate = offer.expires_at ? new Date(offer.expires_at) : null;

        // Check if promo has started
        if (startDate && now < startDate) return false;
        
        // Check if promo has ended
        if (endDate && now > endDate) return false;
        
        // Check if promo has expired
        if (expiryDate && now > expiryDate) return false;
        
        return true;
    };

    const getPromoStatus = (offer) => {
        const now = new Date();
        const startDate = offer.starts_at ? new Date(offer.starts_at) : null;
        const endDate = offer.ends_at ? new Date(offer.ends_at) : null;
        const expiryDate = offer.expires_at ? new Date(offer.expires_at) : null;

        if (startDate && now < startDate) {
            return { status: 'upcoming', message: `Starts ${formatDate(offer.starts_at)}` };
        }
        
        if (endDate && now > endDate) {
            return { status: 'ended', message: `Ended ${formatDate(offer.ends_at)}` };
        }
        
        if (expiryDate && now > expiryDate) {
            return { status: 'expired', message: `Expired ${formatDate(offer.expires_at)}` };
        }
        
        return { status: 'active', message: 'Active now' };
    };

    const discountLabel = currentOffer.discount_type === "percentage"
        ? `${currentOffer.discount_value}% OFF`
        : `${formatCurrency(currentOffer.discount_value)} OFF`;

    const promoStatus = getPromoStatus(currentOffer);
    const isActive = isPromoActive(currentOffer);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center pb-6">
                    <DialogTitle className="text-2xl font-semibold text-gray-900">
                        Exclusive Offers
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Limited-time deals available now
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Image Carousel */}
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-lg bg-gray-100">
                            <div 
                                className="h-64 bg-cover bg-center bg-no-repeat"
                                style={{ 
                                    backgroundImage: `url(${currentOffer.image_url || 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg'})` 
                                }}
                            >
                                <div className="absolute inset-0 bg-black/40" />
                                
                                {/* Discount Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                        isActive 
                                            ? 'bg-green-500 text-white' 
                                            : promoStatus.status === 'upcoming'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-red-500 text-white'
                                    }`}>
                                        {discountLabel}
                                    </span>
                                </div>
                                
                                {/* Slide Counter */}
                                {offers.length > 1 && (
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-black/50 text-white px-2 py-1 rounded text-sm">
                                            {currentSlide + 1} / {offers.length}
                                        </span>
                                    </div>
                                )}

                                {/* Navigation */}
                                {offers.length > 1 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800"
                                            onClick={prevSlide}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800"
                                            onClick={nextSlide}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Slide Indicators */}
                        {offers.length > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {offers.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            index === currentSlide ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}
                                        onClick={() => setCurrentSlide(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {/* Title and Description */}
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {currentOffer.title}
                            </h3>
                            <p className="text-gray-600">
                                {currentOffer.description}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm rounded-full ${
                                isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : promoStatus.status === 'upcoming'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {promoStatus.message}
                            </span>
                        </div>

                        {/* Promo Code */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Promo Code</p>
                                    <p className="text-lg font-mono font-semibold text-gray-900">
                                        {currentOffer.code}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleCopy}
                                    disabled={copied}
                                    className="flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Important Dates</h4>
                            <div className="space-y-2">
                                {currentOffer.starts_at && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-600">Starts:</span>
                                        <span className="font-medium text-gray-900">{formatDateTime(currentOffer.starts_at)}</span>
                                    </div>
                                )}
                                
                                {currentOffer.ends_at && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-600">Ends:</span>
                                        <span className="font-medium text-gray-900">{formatDateTime(currentOffer.ends_at)}</span>
                                    </div>
                                )}
                                
                                {currentOffer.expires_at && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-600">Expires:</span>
                                        <span className="font-medium text-gray-900">{formatDateTime(currentOffer.expires_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExclusiveOffersDialog;
