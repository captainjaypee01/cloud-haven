import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, ImageOff } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const ExclusiveOfferCard = ({ offer, onClick }) => {
    const discountLabel =
        offer.discount_type === "percentage"
            ? `${offer.discount_value}% OFF`
            : `${formatCurrency(offer.discount_value)} OFF`;

    let expiryText = "";
    if (offer.expires_at) {
        const dt = new Date(offer.expires_at);
        expiryText = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const hasImage = offer.image_url || 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg';
    const cardClass = hasImage
        ? "group relative flex flex-col items-start justify-between gap-3 p-6 rounded-xl text-white bg-no-repeat bg-cover bg-center min-h-[260px] cursor-pointer"
        : "group relative flex flex-col items-start justify-between gap-3 p-6 rounded-xl text-gray-800 bg-gray-100 border min-h-[260px] cursor-pointer";
    const overlayClass = hasImage
        ? "absolute inset-0 rounded-xl bg-black/50 pointer-events-none"
        : "";

    return (
        <div className={cardClass}
            style={hasImage ? { backgroundImage: `url(${offer.image_url || 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg'})` } : { backgroundImage: `url(https://res.cloudinary.com/dm3gsotk5/image/upload/v1753977374/background2.jpg)` }}
            onClick={onClick}
            tabIndex={0}
            aria-label={`View details for ${offer.title}`}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
        >
            {hasImage && <div className={overlayClass} />}
            {discountLabel && (
                <span className="px-3 py-1 absolute top-4 right-4 text-xs bg-white text-gray-800 font-medium rounded-full z-10">
                    {discountLabel}
                </span>
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
                {expiryText && (
                    <p className={hasImage ? "text-xs text-white/80 mt-3" : "text-xs text-gray-500 mt-3"}>
                        Expires {expiryText}
                    </p>
                )}
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
