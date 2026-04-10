import React, { useState } from 'react';
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
import { Copy, CheckCircle2, Calendar, Clock, Tag, Percent, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { STATIC_IMG } from '@/constants/staticImages';

const OfferDetailsDialog = ({ open, onOpenChange, offer }) => {
    const [copied, setCopied] = useState(false);

    if (!offer) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(offer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
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

    const isPromoActive = () => {
        const now = new Date();
        const startDate = offer.starts_at ? new Date(offer.starts_at) : null;
        const endDate = offer.ends_at ? new Date(offer.ends_at) : null;
        const expiryDate = offer.expires_at ? new Date(offer.expires_at) : null;

        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        if (expiryDate && now > expiryDate) return false;
        
        return true;
    };

    const getPromoStatus = () => {
        const now = new Date();
        const startDate = offer.starts_at ? new Date(offer.starts_at) : null;
        const endDate = offer.ends_at ? new Date(offer.ends_at) : null;
        const expiryDate = offer.expires_at ? new Date(offer.expires_at) : null;

        if (startDate && now < startDate) {
            return { status: 'upcoming', message: `Starts ${formatDateTime(offer.starts_at)}` };
        }
        
        if (endDate && now > endDate) {
            return { status: 'ended', message: `Ended ${formatDateTime(offer.ends_at)}` };
        }
        
        if (expiryDate && now > expiryDate) {
            return { status: 'expired', message: `Expired ${formatDateTime(offer.expires_at)}` };
        }
        
        return { status: 'active', message: 'Active now' };
    };

    const discountLabel = offer.discount_type === "percentage"
        ? `${offer.discount_value}% OFF`
        : `${formatCurrency(offer.discount_value)} OFF`;

    const promoStatus = getPromoStatus();
    const isActive = isPromoActive();
    const offerImage = offer.image_url || STATIC_IMG.offerFallback;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="w-[95vw] max-w-5xl h-[90vh] max-h-[90vh] sm:w-[90vw] sm:max-w-4xl sm:h-[85vh] sm:max-h-[85vh] mx-auto p-0 flex flex-col overflow-hidden"
                showCloseButton={false}
            >
                {/* Hero Section with Background Image */}
                <div className="relative flex-1 overflow-hidden">
                    {/* Background Image */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${offerImage})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 h-full flex flex-col">
                        {/* Header with Close Button */}
                        <div className="flex justify-between items-start p-6">
                            <div className="flex flex-col gap-2">
                                {/* Status Badge */}
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium w-fit ${
                                    isActive 
                                        ? 'bg-green-500 text-white' 
                                        : promoStatus.status === 'upcoming'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-red-500 text-white'
                                }`}>
                                    {promoStatus.message}
                                </span>
                                
                                {/* Discount Badge */}
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-white/90 text-gray-900 w-fit shadow-lg">
                                    {discountLabel}
                                </span>
                            </div>
                            
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                    <X className="h-5 w-5" />
                                </Button>
                            </DialogClose>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col justify-center px-6 pb-6">
                            <div className="max-w-2xl">
                                {/* Title */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                                    {offer.title}
                                </h1>
                                
                                {/* Description */}
                                <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
                                    {offer.description}
                                </p>

                                {/* Promo Code Section - Hero Style */}
                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Tag className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Your Promo Code</h3>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-mono font-bold tracking-wider text-gray-900">
                                                {offer.code}
                                            </span>
                                        </div>
                                        <Button
                                            size="lg"
                                            className={`flex items-center gap-2 font-semibold transition-all ${
                                                copied 
                                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                            onClick={handleCopy}
                                            disabled={copied}
                                        >
                                            {copied ? (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-5 w-5" />
                                                    Copy Code
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mt-3 text-center">
                                        Click the button above to copy the code to your clipboard
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Info Bar */}
                        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 p-4">
                            <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
                                {offer.starts_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Starts: {formatDateTime(offer.starts_at)}</span>
                                    </div>
                                )}
                                {offer.ends_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Ends: {formatDateTime(offer.ends_at)}</span>
                                    </div>
                                )}
                                {offer.expires_at && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>Expires: {formatDateTime(offer.expires_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OfferDetailsDialog;
