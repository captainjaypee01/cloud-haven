// src/pages/LeaveReview.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SeaWaveBg from '../components/common/SeaWaveBg';
import { useLoader } from "@/context/LoaderContext";

const LeaveReview = () => {
    const { refNo } = useParams();
    const api = useApi();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resortRating, setResortRating] = useState(5);
    const [resortComment, setResortComment] = useState('');
    const [roomRatings, setRoomRatings] = useState({});   // { roomId: rating }
    const [roomComments, setRoomComments] = useState({}); // { roomId: comment }

    useEffect(() => {
        // Fetch booking details to know which rooms were booked
        api.get(`${API_PREFIX}/bookings/ref/${refNo}`)
            .then(res => {
                setBooking(res.data);
                // Initialize roomRatings/Comments for each unique room in booking
                const uniqueRooms = [];
                res.data.booking_rooms.forEach(br => {
                    if (!uniqueRooms.find(r => r.id === br.room_id)) {
                        uniqueRooms.push({ id: br.room_id, name: br.room.name });
                    }
                });
                const initialRatings = {};
                const initialComments = {};
                uniqueRooms.forEach(r => { initialRatings[r.id] = 5; initialComments[r.id] = ''; });
                setRoomRatings(initialRatings);
                setRoomComments(initialComments);
            })
            .catch(err => {
                console.error('Failed to load booking info', err);
                toast.error("Failed to load booking information.");
            })
            .finally(() => setLoading(false));
    }, [refNo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!booking) return;
        show()
        const reviewsPayload = [];
        // Resort review entry
        reviewsPayload.push({ type: 'resort', rating: resortRating, comment: resortComment });
        // Room review entries for each unique room
        for (const [roomId, rating] of Object.entries(roomRatings)) {
            reviewsPayload.push({ type: 'room', room_id: Number(roomId), rating: rating, comment: roomComments[roomId] });
        }
        try {
            await api.post(`${API_PREFIX}/user/reviews`, { booking_id: refNo, reviews: reviewsPayload }, { requiresAuth: true });
            toast.success("Thank you for your feedback!");
            // Optionally redirect or clear form
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to submit review.");
        } finally {
            hide();
        }

    };

    if (loading) return <p>Loading...</p>;
    if (!booking) return <p className="text-red-600">Booking not found or inaccessible.</p>;

    // Assuming booking data has a guest_name and booking_rooms with room details
    const uniqueRooms = [];
    booking.booking_rooms.forEach(br => {
        if (!uniqueRooms.find(r => r.id === br.room_id)) {
            uniqueRooms.push({ id: br.room_id, name: br.room.name });
        }
    });

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <SeaWaveBg />

            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-20">
                <h1 className="text-2xl font-semibold mb-4">Leave a Review for Booking #{booking.reference_number}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-xl font-medium">Resort Review</h2>
                    <div>
                        <label className="block font-medium mb-1">Overall Rating (1-5)</label>
                        <Input
                            type="number" min="1" max="5"
                            value={resortRating}
                            onChange={e => setResortRating(Number(e.target.value))}
                            className="w-16"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Comments</label>
                        <Textarea
                            value={resortComment}
                            onChange={e => setResortComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full"
                        />
                    </div>

                    {uniqueRooms.map(room => (
                        <div key={room.id}>
                            <h3 className="text-lg font-medium mt-4">Room Review – {room.name}</h3>
                            <label className="block font-medium mb-1">Rating (1-5)</label>
                            <Input
                                type="number" min="1" max="5"
                                value={roomRatings[room.id] ?? 5}
                                onChange={e => setRoomRatings({ ...roomRatings, [room.id]: Number(e.target.value) })}
                                className="w-16"
                            />
                            <label className="block font-medium mt-2 mb-1">Comments</label>
                            <Textarea
                                value={roomComments[room.id] ?? ''}
                                onChange={e => setRoomComments({ ...roomComments, [room.id]: e.target.value })}
                                placeholder={`How was ${room.name}?`}
                                className="w-full"
                            />
                        </div>
                    ))}

                    <Button type="submit" className="mt-4">Submit Review</Button>
                </form>
            </div>
        </div>
    );
};

export default LeaveReview;
