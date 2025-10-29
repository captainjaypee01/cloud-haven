import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, ImageOff, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import OptimizedImage from '@/components/common/OptimizedImage';

const ExclusiveOfferCard = ({ offer, onClick }) => {
    const discountLabel =
        offer.discount_type === "percentage"
            ? `${offer.discount_value}% OFF`
            : `${formatCurrency(offer.discount_value)} OFF`;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const dt = new Date(dateString);
        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const dt = new Date(dateString);
        return dt.toLocaleDateString(undefined, { 
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

        // Check if promo has started
        if (startDate && now < startDate) return false;
        
        // Check if promo has ended
        if (endDate && now > endDate) return false;
        
        // Check if promo has expired
        if (expiryDate && now > expiryDate) return false;
        
        return true;
    };

    const getPromoStatus = () => {
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

    const promoStatus = getPromoStatus();
    const isActive = isPromoActive();

    const hasImage = offer.image_url || 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg';
    const cardClass = hasImage
        ? "group relative flex flex-col items-start justify-between gap-3 p-6 rounded-xl text-white bg-no-repeat bg-cover bg-center min-h-[260px] cursor-pointer"
        : "group relative flex flex-col items-start justify-between gap-3 p-6 rounded-xl text-gray-800 bg-gray-100 border min-h-[260px] cursor-pointer";
    const overlayClass = hasImage
        ? "absolute inset-0 rounded-xl bg-black/65 pointer-events-none"
        : "";

    return (
        <div className={cardClass}
            onClick={onClick}
            tabIndex={0}
            aria-label={`View details for ${offer.title}`}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
        >
            <div className="absolute inset-0 -z-10 rounded-xl overflow-hidden">
                <OptimizedImage
                    src={offer.image_url || 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg'}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                />
            </div>
            {hasImage && <div className={overlayClass} />}
            {discountLabel && (
                <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        isActive 
                            ? 'bg-green-500 text-white' 
                            : promoStatus.status === 'upcoming'
                            ? 'bg-blue-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}>
                        {discountLabel}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        isActive 
                            ? 'bg-green-100 text-green-800' 
                            : promoStatus.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {promoStatus.message}
                    </span>
                </div>
            )}
            {!hasImage && (
                <ImageOff className="w-12 h-12 mb-3 text-gray-400" />
            )}
            <div className="relative z-10">
                <h3 className={hasImage ? "text-2xl font-medium font-playfair text-white drop-shadow" : "text-2xl font-medium font-playfair"}>
                    {offer.title}
                </h3>
                <p className={hasImage ? "text-sm text-white/90 mt-1" : "text-sm text-gray-700 mt-1"}>
                    {offer.description}
                </p>
                
                {/* Date Information */}
                <div className="mt-3 space-y-1">
                    {offer.starts_at && (
                        <div className={`flex items-center gap-1 text-xs ${hasImage ? "text-white/80" : "text-gray-500"}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Starts: {formatDateTime(offer.starts_at)}</span>
                        </div>
                    )}
                    
                    {offer.ends_at && (
                        <div className={`flex items-center gap-1 text-xs ${hasImage ? "text-white/80" : "text-gray-500"}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Ends: {formatDateTime(offer.ends_at)}</span>
                        </div>
                    )}
                    
                    {offer.expires_at && (
                        <div className={`flex items-center gap-1 text-xs ${hasImage ? "text-white/80" : "text-gray-500"}`}>
                            <Clock className="h-3 w-3" />
                            <span>Expires: {formatDateTime(offer.expires_at)}</span>
                        </div>
                    )}
                </div>
            </div>
            <Button
                variant={hasImage ? "secondary" : "default"}
                className="flex items-center gap-2 font-medium cursor-pointer mt-4 z-10"
                tabIndex={-1}
                type="button"
            >
                View Offer
                <ArrowRightIcon className={!hasImage ? "text-white" : "text-gray-600"} size={18} />
            </Button>
        </div>
    );
};

export default ExclusiveOfferCard;
