// src/pages/PublicReview.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SeaWaveBg from '../components/common/SeaWaveBg';
import { useLoader } from "@/context/LoaderContext";
import { AlertCircleIcon, StarIcon, CheckCircleIcon } from 'lucide-react';
import SEO from '@/components/SEO'

const PublicReview = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resortRating, setResortRating] = useState(5);
    const [resortComment, setResortComment] = useState('');
    const [roomRatings, setRoomRatings] = useState({});
    const [roomComments, setRoomComments] = useState({});

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        // Fetch booking details using token
        show();
        api.get(`${API_PREFIX}/reviews/booking`, { params: { token } })
            .then(res => {
                setBooking(res.data.data.booking);
                setRooms(res.data.data.rooms);
                
                // Check if already reviewed
                if (res.data.data.already_reviewed) {
                    setSubmitted(true);
                    return;
                }
                
                // Initialize room ratings and comments
                const initialRatings = {};
                const initialComments = {};
                res.data.data.rooms.forEach(room => {
                    initialRatings[room.slug] = 5;
                    initialComments[room.slug] = '';
                });
                setRoomRatings(initialRatings);
                setRoomComments(initialComments);
            })
            .catch(err => {
                console.error('Failed to load booking info', err);
                if (err.response?.status === 404) {
                    toast.error("Invalid or expired review link.");
                } else if (err.response?.status === 410) {
                    toast.error("This review link has expired or has already been used.");
                } else {
                    toast.error("Failed to load booking information.");
                }
            })
            .finally(() => { 
                setLoading(false); 
                hide(); 
            });
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!booking || submitting) return;

        setSubmitting(true);
        show();

        const reviewsPayload = [];
        
        // Resort review entry
        reviewsPayload.push({ 
            type: 'resort', 
            rating: resortRating, 
            comment: resortComment 
        });
        
        // Room review entries for each unique room
        for (const [roomSlug, rating] of Object.entries(roomRatings)) {
            reviewsPayload.push({ 
                type: 'room', 
                room_slug: roomSlug, 
                rating: rating, 
                comment: roomComments[roomSlug] 
            });
        }

        try {
            await api.post(`${API_PREFIX}/reviews/submit`, { 
                token, 
                reviews: reviewsPayload 
            });
            
            setSubmitted(true);
            toast.success("Thank you for your feedback! Your review has been submitted successfully.");
            
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                toast.error("Invalid or expired review link.");
            } else if (err.response?.status === 410) {
                toast.error("This review link has expired or has already been used.");
            } else if (err.response?.status === 400) {
                toast.error(err.response?.data?.error || "This booking has already been reviewed.");
            } else {
                toast.error(err.response?.data?.error || "Failed to submit review. Please try again.");
            }
        } finally {
            setSubmitting(false);
            hide();
        }
    };

    const StarRating = ({ rating, onRatingChange, disabled = false }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => !disabled && onRatingChange(star)}
                        disabled={disabled}
                        className={`p-1 transition-colors ${
                            star <= rating 
                                ? 'text-yellow-400 hover:text-yellow-500' 
                                : 'text-gray-300 hover:text-gray-400'
                        } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <StarIcon className="w-6 h-6 fill-current" />
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center justify-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
                <SEO 
                    title="Leave a Review | Netania De Laiya" 
                    description="Share your experience at Netania De Laiya. Help other guests by leaving a review of your premium beachfront resort stay with direct beach access and exceptional service in Laiya, Batangas." 
                    noindex={true}
                    og={{
                        title: 'Leave a Review - Netania De Laiya Resort',
                        description: 'Share your experience at Netania De Laiya. Help other guests by leaving a review of your beachfront resort stay in Laiya, Batangas.',
                        image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1754846908/bg-cover.jpg',
                        type: 'website',
                        locale: 'en_PH',
                        siteName: 'Netania De Laiya'
                    }}
                />
                <SeaWaveBg />
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your booking information...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center justify-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
                <SEO 
                    title="Leave a Review | Netania De Laiya" 
                    description="Share your experience at Netania De Laiya. Help other guests by leaving a review of your premium beachfront resort stay with direct beach access and exceptional service in Laiya, Batangas." 
                    noindex={true}
                    og={{
                        title: 'Leave a Review - Netania De Laiya Resort',
                        description: 'Share your experience at Netania De Laiya. Help other guests by leaving a review of your beachfront resort stay in Laiya, Batangas.',
                        image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1754846908/bg-cover.jpg',
                        type: 'website',
                        locale: 'en_PH',
                        siteName: 'Netania De Laiya'
                    }}
                />
                <SeaWaveBg />
                <AlertCircleIcon className="h-8 w-8 text-red-500 mb-4" />
                <p className="text-red-600 text-lg font-medium mb-4">
                    Invalid review link
                </p>
                <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                >
                    Go back to Home
                </Button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center justify-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
                <SEO 
                    title="Leave a Review | Netania De Laiya" 
                    description="Share your experience at Netania De Laiya. Help other guests by leaving a review of your premium beachfront resort stay with direct beach access and exceptional service in Laiya, Batangas." 
                    noindex={true}
                    og={{
                        title: 'Leave a Review - Netania De Laiya Resort',
                        description: 'Share your experience at Netania De Laiya. Help other guests by leaving a review of your beachfront resort stay in Laiya, Batangas.',
                        image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1754846908/bg-cover.jpg',
                        type: 'website',
                        locale: 'en_PH',
                        siteName: 'Netania De Laiya'
                    }}
                />
                <SeaWaveBg />
                <AlertCircleIcon className="h-8 w-8 text-red-500 mb-4" />
                <p className="text-red-600 text-lg font-medium mb-4">
                    Booking not found or review link is invalid
                </p>
                <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                >
                    Go back to Home
                </Button>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center justify-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
                <SEO 
                    title="Review Submitted | Netania De Laiya" 
                    description="Thank you for your review. Your feedback helps us improve our premium beachfront resort services with exceptional hospitality in Laiya, Batangas." 
                    noindex={true}
                    og={{
                        title: 'Review Submitted | Netania De Laiya',
                        description: 'Thank you for your review. Your feedback helps us improve our premium beachfront resort services with exceptional hospitality in Laiya, Batangas.',
                        image: 'https://res.cloudinary.com/dm3gsotk5/image/upload/v1754846908/bg-cover.jpg',
                        type: 'website',
                        locale: 'en_PH',
                        siteName: 'Netania De Laiya'
                    }}
                />
                <SeaWaveBg />
                <div className="text-center max-w-md">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h1>
                    <p className="text-gray-600 mb-6">
                        Your review has been submitted successfully. We appreciate your feedback and it helps us improve our services.
                    </p>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full"
                    >
                        Return to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <SEO title="Leave a Review" description="Share your experience at Netania De Laiya." noindex={true} />
            <SeaWaveBg />

            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-20">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold mb-2">How was your stay?</h1>
                    <p className="text-gray-600">Booking #{booking.reference_number}</p>
                    <p className="text-sm text-gray-500">
                        {booking.guest_name} • {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Resort Review Section */}
                    <div className="border-b pb-6">
                        <h2 className="text-xl font-medium mb-4">Overall Resort Experience</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-medium mb-2">How would you rate your overall experience?</label>
                                <StarRating 
                                    rating={resortRating} 
                                    onRatingChange={setResortRating}
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-2">Tell us about your experience</label>
                                <Textarea
                                    value={resortComment}
                                    onChange={e => setResortComment(e.target.value)}
                                    placeholder="Share your thoughts about your stay at Netania De Laiya..."
                                    className="w-full min-h-[100px]"
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room Reviews Section */}
                    {rooms.map(room => (
                        <div key={room.slug} className="border-b pb-6 last:border-b-0">
                            <h3 className="text-lg font-medium mb-4">
                                Room: {room.name}
                                {room.units && room.units.length > 0 && (
                                    <span className="text-sm text-gray-500 ml-2">
                                        (Units: {room.units.join(', ')})
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-2">How would you rate this room?</label>
                                    <StarRating 
                                        rating={roomRatings[room.slug] || 5} 
                                        onRatingChange={(rating) => setRoomRatings({ ...roomRatings, [room.slug]: rating })}
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium mb-2">Room feedback</label>
                                    <Textarea
                                        value={roomComments[room.slug] || ''}
                                        onChange={e => setRoomComments({ ...roomComments, [room.slug]: e.target.value })}
                                        placeholder={`How was your experience in ${room.name}?`}
                                        className="w-full min-h-[100px]"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-6">
                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting Review...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PublicReview;
