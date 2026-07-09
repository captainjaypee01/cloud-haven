import { useState } from 'react';
import { useApi } from './useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';

export const useBookingModification = () => {
    const [isLoading, setIsLoading] = useState(false);
    const api = useApi();

    const modifyBooking = async (bookingId, modificationData) => {
        setIsLoading(true);
        try {
            const response = await api.patch(
                `${API_PREFIX}/admin/bookings/${bookingId}/modify`,
                modificationData,
                { requiresAuth: true }
            );
            
            toast.success('Booking modified successfully');
            return response.data;
        } catch (error) {
            if (error.response?.data?.downpayment_shortfall) {
                toast.error(error.response.data.error || 'Downpayment shortfall must be acknowledged.');
            }
            const errorMessage = error.response?.data?.error
                || error.response?.data?.message
                || 'Failed to modify booking';
            toast.error(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        modifyBooking,
        isLoading,
    };
};
