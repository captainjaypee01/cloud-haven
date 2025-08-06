import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import Title from '../Title';
import { ImageOff } from 'lucide-react';
import ExclusiveOfferCard from './ExclusiveOfferCard';
import OfferDetailsDialog from './OfferDetailsDialog';

const ExclusiveOffers = () => {
    const api = useApi();
    const { data: offers, isLoading, error } = useQuery({
        queryKey: ['exclusiveOffers'],
        queryFn: async () => {
            const res = await api.get(`${API_PREFIX}/promos/exclusive`);
            return res.data?.data ?? [];
        }
    });

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);

    const handleCardClick = (offer) => {
        setSelectedOffer(offer);
        setOpenDialog(true);
    };

    return (
        <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-30 bg-white'>
            <div className='flex flex-col md:flex-row items-center justify-between w-full'>
                <Title
                    title='Exclusive Offers'
                    subTitle='Take advantage of our limited-time offers and special packages to enhance your stay.'
                    align='left'
                />
            </div>

            {isLoading ? (
                <div className='flex flex-col items-center justify-center py-24'>
                    <p className="mt-4 text-gray-400 text-sm">Loading offers...</p>
                </div>
            ) : error ? (
                <div className='flex flex-col items-center justify-center py-24'>
                    <p className="text-red-600">Failed to load offers.</p>
                </div>
            ) : (!offers || offers.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16 w-full">
                    <ImageOff className="w-14 h-14 text-gray-300 mb-2" />
                    <span className="text-gray-500 text-base mt-2">No exclusive offers at this time.</span>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full'>
                    {offers.map(offer => (
                        <ExclusiveOfferCard
                            key={offer.id}
                            offer={offer}
                            onClick={() => handleCardClick(offer)}
                        />
                    ))}
                </div>
            )}

            {/* Dialog for Offer Details */}
            <OfferDetailsDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                offer={selectedOffer}
            />
        </div>
    );
};

export default ExclusiveOffers;
