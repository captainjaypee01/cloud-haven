import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import BookingDetailsContent from '@/components/admin/booking/BookingDetailsContent';
import { useLoader } from "@/context/LoaderContext";

const BookingDetails = () => {
    const { id } = useParams();
    const { show, hide } = useLoader();
    const api = useApi();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBooking = async () => {
        setLoading(true);
        show()
        try {

            const res = await api.get(`${API_PREFIX}/admin/bookings/${id}`, { requiresAuth: true });
            console.log(res.data);
            setBooking(res?.data);
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
        hide();
    };
    useEffect(() => {
        fetchBooking();
    }, [id]);

    return <BookingDetailsContent booking={booking} fetchBooking={fetchBooking} />;
};

export default BookingDetails;
