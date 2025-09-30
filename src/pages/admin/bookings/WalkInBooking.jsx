import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { formatCurrency } from '@/lib/format';
import { Plus, Minus, X, Users, Bed, Calendar, Clock, Trash } from 'lucide-react';
import Title from '@/components/Title';
import { fetchDayTourAvailability } from '@/services/dayTour';
import { useWalkInMealCalculation } from '@/hooks/walkin/useWalkInMealCalculation';
import { formatBuffetDate, formatBuffetSummaryDates, formatMealDate, formatBuffetDateRange } from '@/utils/dateUtils';
import { addDays, format } from 'date-fns';
import { usePromoCode } from '@/context/PromoCodeContext';
import { useAppContext } from '@/context/AppContext';
import { WalkInDayTourDatePicker, WalkInDateRangePicker } from '@/components/WalkInDatePicker';

// Helper function to get consistent local date in YYYY-MM-DD format
const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Form validation schema
const FormSchema = z.object({
    booking_type: z.enum(['day_tour', 'overnight'], {
        required_error: "Please select a booking type",
    }),
    nights: z.number().min(1).max(5).optional(), // For staff users only
    guest_name: z.string().min(1, "Guest name is required"),
    guest_email: z.string().email("Please provide a valid email address"),
    guest_phone: z.string().min(1, "Guest phone is required"),
    special_requests: z.string().optional(),
    rooms: z.array(z.object({
        room_id: z.string(),
        quantity: z.number().min(1),
        adults: z.number().min(1),
        children: z.number().min(0),
    })).min(1, "At least one room must be selected"),
    // Date fields for admin/superadmin
    check_in_date: z.string().optional(),
    day_tour_date: z.string().optional(),
});

const WalkInBooking = () => {
    const navigate = useNavigate();
    const api = useApi();
    const { userRole } = useAppContext();
    
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [dayTourMealData, setDayTourMealData] = useState(null);
    const [dayTourPricing, setDayTourPricing] = useState(null);
    const [mealLoading, setMealLoading] = useState(false);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    
    // Date selection state for admin/superadmin
    const [selectedCheckInDate, setSelectedCheckInDate] = useState(null);
    const [selectedDayTourDate, setSelectedDayTourDate] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState({ from: null, to: null });
    
    // Check if user can select dates (admin or superadmin)
    const canSelectDates = userRole === 'admin' || userRole === 'superadmin';
    
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            booking_type: 'day_tour',
            nights: 1, // Default for staff users
            guest_name: '',
            guest_email: '',
            guest_phone: '',
            special_requests: '',
            rooms: [],
            check_in_date: '',
            day_tour_date: '',
        }
    });

    const bookingType = form.watch('booking_type');
    const formNights = form.watch('nights');

    // Calculate nights based on user role
    const calculateNights = () => {
        if (bookingType === 'overnight') {
            if (canSelectDates && selectedDateRange.from && selectedDateRange.to) {
                // For admin/superadmin: calculate from date range
                const checkIn = new Date(selectedDateRange.from);
                const checkOut = new Date(selectedDateRange.to);
                const diffTime = checkOut - checkIn;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return Math.max(1, diffDays); // Minimum 1 night
            } else {
                // For staff users: use form nights value
                return formNights || 1;
            }
        }
        return 0; // Day tours have 0 nights
    };

    const nights = calculateNights();

    // Helper functions to get current date based on user role and selections
    const getCurrentDate = () => {
        if (canSelectDates) {
            if (bookingType === 'day_tour' && selectedDayTourDate) {
                return format(selectedDayTourDate, 'yyyy-MM-dd');
            } else if (bookingType === 'overnight' && selectedDateRange.from) {
                return format(selectedDateRange.from, 'yyyy-MM-dd');
            }
        }
        return getLocalDateString();
    };

    const getCheckOutDate = () => {
        if (canSelectDates && bookingType === 'overnight' && selectedDateRange.to) {
            return format(selectedDateRange.to, 'yyyy-MM-dd');
        } else if (bookingType === 'overnight') {
            // For staff users, calculate check-out based on 1 night default
            return format(addDays(new Date(), 1), 'yyyy-MM-dd');
        }
        return getLocalDateString();
    };

    // Promo code state
    const { promoCode, promoInfo, promoError, setPromoCode, clearPromo, applyPromo, recalculatePromo } = usePromoCode();
    const [promoCodeInput, setPromoCodeInput] = useState('');
    
    // Ref to prevent infinite loops during promo recalculation
    const isRecalculating = useRef(false);
    const isClearingPromo = useRef(false);

    // Use the meal calculation hook for overnight bookings
    const { 
        mealQuote, 
        mealCost, 
        extraGuestFeeTotal, 
        summaryWithMealBreakdown,
        mealLoading: mealCalculationLoading
    } = useWalkInMealCalculation(bookingType, nights, selectedRooms);

    // Update form rooms field when selectedRooms changes
    useEffect(() => {
        const roomsData = selectedRooms.map(roomItem => ({
            room_id: roomItem.room_id,
            quantity: 1,
            adults: roomItem.adults,
            children: roomItem.children,
        }));
        form.setValue('rooms', roomsData);
    }, [selectedRooms, form]);

    // Clear promo code when booking type, dates, or nights change
    useEffect(() => {
        if (promoInfo) {
            console.log('WalkIn: Clearing promo due to booking type, dates, or nights change', { bookingType, selectedDayTourDate, selectedDateRange, formNights });
            isClearingPromo.current = true;
            clearPromo();
            setPromoCodeInput('');
            
            // Reset the clearing flag after a short delay
            setTimeout(() => {
                isClearingPromo.current = false;
            }, 100);
        }
    }, [bookingType, selectedDayTourDate, selectedDateRange, formNights]);

    // Auto-recalculate promo when cart contents change
    useEffect(() => {
        console.log('WalkIn: Auto-recalc useEffect triggered', {
            hasPromoInfo: !!promoInfo,
            selectedRoomsCount: selectedRooms.length,
            isRecalculating: isRecalculating.current,
            isClearingPromo: isClearingPromo.current
        });
        
        if (promoInfo && selectedRooms.length > 0 && !isRecalculating.current && !isClearingPromo.current) {
            console.log('WalkIn: Proceeding with promo recalculation');
            isRecalculating.current = true;
            
            const totals = calculateTotal();
            const bookingDates = {
                checkIn: getCurrentDate(),
                checkOut: getCheckOutDate(),
                dayTourDate: bookingType === 'day_tour' ? getCurrentDate() : null
            };
            
            // Recalculate promo discount with new totals
            recalculatePromo(
                api, 
                totals.roomTotal, 
                totals.mealTotal, 
                totals.total, 
                bookingDates, 
                mealQuote
            );
            
            // Reset the flag after a short delay
            setTimeout(() => {
                isRecalculating.current = false;
            }, 100);
        }
    }, [selectedRooms, mealQuote]); // Remove promoInfo dependency to prevent infinite loops

    // Fetch meal data and pricing based on booking type
    useEffect(() => {
        if (bookingType === 'day_tour') {
            fetchDayTourMealData();
            fetchDayTourPricing();
        } else if (bookingType === 'overnight' && nights > 0) {
            fetchOvernightMealQuote();
        } else {
            setDayTourMealData(null);
            setDayTourPricing(null);
        }
    }, [bookingType, nights, selectedDayTourDate, selectedDateRange, formNights]);

    // Fetch available rooms when booking type, dates, or nights change
    useEffect(() => {
        fetchAvailableRooms();
        // Clear selected rooms when booking type changes
        setSelectedRooms([]);
    }, [bookingType, nights, selectedDayTourDate, selectedDateRange, formNights]);

    const fetchAvailableRooms = async () => {
        setAvailabilityLoading(true);
        try {
            const checkInDate = getCurrentDate();
            let response;

            if (bookingType === 'day_tour') {
                // For day tours, use the day tour availability endpoint
                response = await api.get(`${API_PREFIX}/day-tours/availability`, {
                    params: { date: checkInDate }
                });
                // The response structure is different for day tour availability
                setRooms(response?.data?.rooms || []);
            } else {
                // For overnight bookings, use the regular rooms endpoint with availability
                const checkOutDate = getCheckOutDate();

                response = await api.get(`${API_PREFIX}/rooms`, {
                    params: { check_in: checkInDate, check_out: checkOutDate }
                });
                setRooms(response?.data?.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            toast.error("Failed to fetch available rooms");
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const fetchDayTourMealData = async () => {
        setMealLoading(true);
        try {
            const selectedDate = getCurrentDate();
            const mealData = await fetchDayTourAvailability(api, selectedDate);
            setDayTourMealData(mealData);
        } catch (error) {
            console.error('Failed to fetch Day Tour meal data:', error);
            setDayTourMealData(null);
        } finally {
            setMealLoading(false);
        }
    };

    const fetchDayTourPricing = async () => {
        try {
            const selectedDate = getCurrentDate();
            const response = await api.get(`${API_PREFIX}/day-tour-pricing/current`, {
                params: { date: selectedDate }
            });
            setDayTourPricing(response.data);
        } catch (error) {
            console.error('Failed to fetch Day Tour pricing:', error);
            setDayTourPricing(null);
        }
    };

    const fetchOvernightMealQuote = async () => {
        setMealLoading(true);
        try {
            const checkInDate = getCurrentDate();
            const checkOutDate = getCheckOutDate();
            
            const response = await api.post(`${API_PREFIX}/meals/quote`, {
                check_in: checkInDate,
                check_out: checkOutDate
            });
            
            setDayTourMealData(response.data); // Reuse the same state for overnight meal data
        } catch (error) {
            console.error('Failed to fetch overnight meal quote:', error);
            setDayTourMealData(null);
        } finally {
            setMealLoading(false);
        }
    };

    const addRoom = (room) => {
        // Check availability before adding room
        const availableUnits = bookingType === 'day_tour' 
            ? (room.available_units || 0)
            : (room.available_count || 0);
        if (availableUnits <= 0) {
            toast.error("This room is not available");
            return;
        }

        // Count how many of this room type are already selected
        const roomId = room.room_id || room.roomId || room.slug;
        const alreadySelectedCount = selectedRooms.filter(r => r.room_id === roomId).length;
        
        if (alreadySelectedCount >= availableUnits) {
            toast.error(`Only ${availableUnits} unit${availableUnits > 1 ? 's' : ''} available for ${room.name}`);
            return;
        }

        const addedAt = Date.now();
        const uniqueId = `${roomId}-${addedAt}`;
        
        // Use correct field names based on booking type
        const roomName = room.name;
        const roomPrice = bookingType === 'day_tour' 
            ? (dayTourPricing?.price_per_pax || room.price_per_pax || room.base_price) 
            : (room.price || room.price_per_night);
        
        // Use correct guest limits based on booking type
        const defaultAdults = bookingType === 'day_tour' 
            ? Math.min(room.min_guests || 2, room.max_guests || 10)
            : Math.min(room.max_guests || 2);
        
        const newRoomItem = {
            uniqueId,
            room_id: roomId,
            room_name: roomName,
            room_price: roomPrice,
            adults: defaultAdults,
            children: 0,
            total_guests: defaultAdults,
            addedAt: new Date(addedAt),
            // Store room limits for validation (following guest-side cart implementation)
            min_guests: room.min_guests || 1,
            max_guests: bookingType === 'day_tour' 
                ? (room.max_guests || 10)
                : (room.max_guests || 2), // Base max guests (e.g., 6)
            extra_guests: bookingType === 'day_tour'
                ? 0
                : (room.extra_guests || 0), // Additional capacity (e.g., 2)
            max_guests_range: bookingType === 'day_tour' 
                ? (room.max_guests_range || room.max_guests || 10)
                : ((room.max_guests || 2) + (room.extra_guests || 0)), // Total capacity (e.g., 8)
            available_units: availableUnits
        };
        setSelectedRooms(prev => [...prev, newRoomItem]);
        toast.success(`Added ${roomName} to ${bookingType === 'day_tour' ? 'facilities' : 'booking'}`);
    };

    const removeRoom = (uniqueId) => {
        setSelectedRooms(prev => prev.filter(r => r.uniqueId !== uniqueId));
    };

    const updateRoomGuests = (uniqueId, field, value) => {
        setSelectedRooms(prev => prev.map(r => {
            if (r.uniqueId === uniqueId) {
                const newAdults = field === 'adults' ? value : r.adults;
                const newChildren = field === 'children' ? value : r.children;
                const newTotalGuests = newAdults + newChildren;
                
                return { 
                    ...r, 
                    [field]: value, 
                    total_guests: newTotalGuests
                };
            }
            return r;
        }));
    };

    const calculateTotal = () => {
        const numNights = bookingType === 'overnight' ? nights : 0;
        let roomTotal = 0;

        selectedRooms.forEach(roomItem => {
            if (bookingType === 'day_tour') {
                // For day tours, calculate: pricePerPax * totalGuests
                const totalGuests = roomItem.adults + roomItem.children;
                roomTotal += roomItem.room_price * totalGuests;
            } else {
                // For overnight bookings, use per night pricing
                roomTotal += roomItem.room_price * numNights;
            }
        });

        let mealTotal = 0;
        if (bookingType === 'day_tour' && dayTourMealData && selectedRooms.length > 0) {
            // For day tours, calculate meal costs based on selected meals
            selectedRooms.forEach(roomItem => {
                const totalGuests = roomItem.adults + roomItem.children;
                // Add lunch and PM snack costs if available
                if (dayTourMealData.lunch_prices && roomItem.include_lunch) {
                    mealTotal += dayTourMealData.lunch_prices.adult * roomItem.adults + 
                                dayTourMealData.lunch_prices.child * roomItem.children;
                }
                if (dayTourMealData.pm_snack_prices && roomItem.include_pm_snack) {
                    mealTotal += dayTourMealData.pm_snack_prices.adult * roomItem.adults + 
                                dayTourMealData.pm_snack_prices.child * roomItem.children;
                }
            });
        } else if (bookingType === 'overnight') {
            // For overnight bookings, use the meal calculation from the hook
            mealTotal = mealCost + extraGuestFeeTotal;
        }

        return {
            roomTotal,
            mealTotal,
            total: roomTotal + mealTotal,
            numNights
        };
    };

    // Handle promo code application
    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return;
        
        const bookingDates = {
            checkIn: getCurrentDate(),
            checkOut: getCheckOutDate(),
            dayTourDate: bookingType === 'day_tour' ? getCurrentDate() : null
        };
        
        await applyPromo(
            api, 
            promoCodeInput, 
            totals.roomTotal, 
            totals.mealTotal, 
            totals.total, 
            bookingDates, 
            mealQuote
        );
        
        // If successful, update the promo code state
        const promoInfoFromContext = promoInfo;
        if (promoInfoFromContext) {
            setPromoCode(promoCodeInput);
        }
    };

    const onSubmit = async (data) => {
        console.log('Form submitted with data:', data);
        console.log('Selected rooms:', selectedRooms);
        
        if (selectedRooms.length === 0) {
            toast.error(`Please select at least one ${bookingType === 'day_tour' ? 'facility' : 'room'}`);
            return;
        }

        // Validate guest counts for each room
        const validationErrors = [];
        
        for (const roomItem of selectedRooms) {
            const totalGuests = roomItem.adults + roomItem.children;
            const minGuests = roomItem.min_guests || 1;
            const maxGuests = roomItem.max_guests_range || roomItem.max_guests || 10;
            
            if (totalGuests < minGuests) {
                validationErrors.push(`"${roomItem.room_name}" requires minimum ${minGuests} guests (currently ${totalGuests})`);
            }
            
            if (totalGuests > maxGuests) {
                validationErrors.push(`"${roomItem.room_name}" allows maximum ${maxGuests} guests (currently ${totalGuests})`);
            }
            
            // Additional validation for day tour rooms
            if (bookingType === 'day_tour' && totalGuests === 0) {
                validationErrors.push(`"${roomItem.room_name}" must have at least 1 guest`);
            }
        }
        
        if (validationErrors.length > 0) {
            const errorMessage = validationErrors.length === 1 
                ? validationErrors[0]
                : `Multiple validation errors:\n• ${validationErrors.join('\n• ')}`;
            
            toast.error(errorMessage, {
                duration: 8000,
                style: {
                    whiteSpace: 'pre-line'
                }
            });
            return;
        }

        setLoading(true);
        try {
            // Convert selectedRooms to the format expected by the backend
            const roomsData = selectedRooms.map(roomItem => ({
                room_id: roomItem.room_id,
                quantity: 1, // Each room item is quantity 1
                adults: roomItem.adults,
                children: roomItem.children,
                total_guests: roomItem.total_guests,
                // For day tours, include meal selections
                ...(bookingType === 'day_tour' && {
                    include_lunch: roomItem.include_lunch || false,
                    include_pm_snack: roomItem.include_pm_snack || false
                })
            }));

            const formData = {
                ...data,
                rooms: roomsData,
                local_date: getCurrentDate(), // Send the selected date to avoid timezone issues
                nights: nights, // Include calculated nights
                ...(promoInfo && promoInfo.id && { promo_id: promoInfo.id }), // Include promo if applied
            };

            const response = await api.post(`${API_PREFIX}/admin/bookings/walk-in`, formData, {
                requiresAuth: true
            });

            toast.success(`Walk-in booking created successfully! Reference: ${response?.data?.reference_number}`);

            // Navigate to booking details
            navigate(`/admin/bookings/${response?.data?.id}`);
        } catch (error) {
            console.error('Walk-in booking error:', error);
            toast.error(error?.response?.data?.message || "Failed to create walk-in booking");
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotal();
    const today = getCurrentDate();

    return (
        <div className="space-y-6">
            <Title
                align='left'
                font='outfit'
                title='Walk-In Booking'
                subTitle='Create a booking for guests who walk in to the resort today.'
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Booking Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Booking Details
                            </CardTitle>
                            <CardDescription>
                                {bookingType === 'day_tour' 
                                    ? `Day Tour for ${canSelectDates && selectedDayTourDate ? format(selectedDayTourDate, 'yyyy-MM-dd') : today}`
                                    : `Check-in: ${today}${nights ? `, Check-out: ${getCheckOutDate()}` : ''}`
                                }
                                {!canSelectDates && (
                                    <span className="block text-xs text-gray-500 mt-1">
                                        Staff can only create bookings for today
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form id="walkin-booking-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {/* Booking Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="booking_type">Booking Type *</Label>
                                    <Select
                                        value={bookingType}
                                        onValueChange={(value) => form.setValue('booking_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select booking type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="day_tour">Day Tour</SelectItem>
                                            <SelectItem value="overnight">Overnight</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.booking_type && (
                                        <p className="text-sm text-red-600">
                                            {form.formState.errors.booking_type.message}
                                        </p>
                                    )}
                                </div>

                                {/* Date Selection (for admin/superadmin only) */}
                                {canSelectDates && (
                                    <div className="space-y-4">
                                        <Separator />
                                        <h3 className="text-lg font-semibold">Booking Dates</h3>
                                        
                                        {bookingType === 'day_tour' ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="day_tour_date">Day Tour Date *</Label>
                                                <WalkInDayTourDatePicker
                                                    date={selectedDayTourDate}
                                                    onChange={(date) => {
                                                        setSelectedDayTourDate(date);
                                                        form.setValue('day_tour_date', date ? format(date, 'yyyy-MM-dd') : '');
                                                    }}
                                                />
                                                {form.formState.errors.day_tour_date && (
                                                    <p className="text-sm text-red-600">
                                                        {form.formState.errors.day_tour_date.message}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label htmlFor="check_in_date">Check-in & Check-out Dates *</Label>
                                                <WalkInDateRangePicker
                                                    range={selectedDateRange}
                                                    onChange={(range) => {
                                                        setSelectedDateRange(range);
                                                        form.setValue('check_in_date', range.from ? format(range.from, 'yyyy-MM-dd') : '');
                                                    }}
                                                />
                                                {form.formState.errors.check_in_date && (
                                                    <p className="text-sm text-red-600">
                                                        {form.formState.errors.check_in_date.message}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Nights Selection (for staff users only) */}
                                {!canSelectDates && bookingType === 'overnight' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="nights">Number of Nights *</Label>
                                        <Select
                                            value={formNights?.toString()}
                                            onValueChange={(value) => form.setValue('nights', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select number of nights" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <SelectItem key={num} value={num.toString()}>
                                                        {num} night{num > 1 ? 's' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.nights && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.nights.message}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Guest Information */}
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Guest Information</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="guest_name">Guest Name *</Label>
                                            <Input
                                                {...form.register('guest_name')}
                                                placeholder="Enter guest name"
                                            />
                                            {form.formState.errors.guest_name && (
                                                <p className="text-sm text-red-600">
                                                    {form.formState.errors.guest_name.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest_email">Guest Email *</Label>
                                            <Input
                                                {...form.register('guest_email')}
                                                type="email"
                                                placeholder="Enter guest email"
                                            />
                                            {form.formState.errors.guest_email && (
                                                <p className="text-sm text-red-600">
                                                    {form.formState.errors.guest_email.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest_phone">Guest Phone *</Label>
                                            <Input
                                                {...form.register('guest_phone')}
                                                placeholder="Enter guest phone"
                                            />
                                            {form.formState.errors.guest_phone && (
                                                <p className="text-sm text-red-600">
                                                    {form.formState.errors.guest_phone.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="special_requests">Special Requests</Label>
                                        <Textarea
                                            {...form.register('special_requests')}
                                            placeholder="Any special requests or notes..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Room Selection */}
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">
                                        {bookingType === 'day_tour' ? 'Facility Selection' : 'Room Selection'}
                                    </h3>
                                    
                                    {availabilityLoading ? (
                                        <div className="text-center py-4">
                                            <p>Loading available {bookingType === 'day_tour' ? 'facilities' : 'rooms'}...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {rooms.map((room, index) => {
                                                // Handle different room structures for day tour vs overnight
                                                // For day tour: room_id, for overnight: slug
                                                const roomId = room.room_id || room.roomId || room.slug || room.id || `room-${index}`;
                                                const roomName = room.name;
                                                // For overnight: display total capacity (max_guests + extra_guests)
                                                const baseMaxGuests = room.max_guests || 2;
                                                const extraGuests = room.extra_guests || 0;
                                                const maxGuests = bookingType === 'day_tour' 
                                                    ? (room.max_guests_range || room.max_guests)
                                                    : (baseMaxGuests + extraGuests);
                                                const totalAvailableUnits = bookingType === 'day_tour' 
                                                    ? (room.available_units || 0)
                                                    : (room.available_count || 0);
                                                
                                                // Debug logging for overnight bookings
                                                if (bookingType === 'overnight') {
                                                    console.log('Room availability debug:', {
                                                        roomName: room.name,
                                                        available_count: room.available_count,
                                                        pending_count: room.pending_count,
                                                        total_units: room.total_units,
                                                        totalAvailableUnits,
                                                        room
                                                    });
                                                }
                                                const minGuests = room.min_guests || 1;
                                                
                                                // Calculate remaining available units after current selections
                                                const alreadySelectedCount = selectedRooms.filter(r => r.room_id === roomId).length;
                                                const remainingUnits = totalAvailableUnits - alreadySelectedCount;
                                                
                                                return (
                                                    <Card key={`room-${roomId}`} className="cursor-pointer hover:shadow-md transition-shadow">
                                                        <CardContent className="p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h4 className="font-semibold">{roomName}</h4>
                                                                    <p className="text-sm text-gray-600">{room.short_description || room.description || (bookingType === 'day_tour' ? 'Day Tour facility' : 'Overnight accommodation')}</p>
                                                                </div>
                                                                <Badge variant="secondary">
                                                                    {bookingType === 'day_tour' 
                                                                        ? formatCurrency(dayTourPricing?.price_per_pax || room.price_per_pax || room.base_price)
                                                                        : `${formatCurrency(room.price || room.price_per_night)}/night`
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4" />
                                                                    {bookingType === 'day_tour' 
                                                                        ? `${minGuests}-${maxGuests} guests`
                                                                        : (
                                                                            <span>Up to {baseMaxGuests} guests
                                                                                {extraGuests > 0 && (
                                                                                    <span className="text-xs ml-1">
                                                                                        (+{extraGuests} extra)
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Bed className="h-4 w-4" />
                                                                    {room.roomType || room.room_type}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span className={remainingUnits <= 0 ? 'text-red-600 font-medium' : ''}>
                                                                        {bookingType === 'overnight' && room.pending_count > 0 
                                                                            ? `${remainingUnits} of ${totalAvailableUnits} available, ${room.pending_count} pending`
                                                                            : `${remainingUnits} of ${totalAvailableUnits} available`
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                onClick={() => addRoom(room)}
                                                                size="sm"
                                                                className="w-full"
                                                                disabled={remainingUnits <= 0}
                                                            >
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                {remainingUnits <= 0 ? 'Not Available' : (bookingType === 'day_tour' ? 'Add Facility' : 'Add Room')}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Rooms - Following Cart Implementation */}
                                {selectedRooms.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">
                                            {bookingType === 'day_tour' ? 'Selected Facilities' : 'Selected Rooms'} ({selectedRooms.length})
                                        </h3>
                                        {selectedRooms.map((roomItem, index) => (
                                            <div
                                                key={roomItem.uniqueId}
                                                className="border rounded-xl p-4 md:p-6 flex flex-col gap-4 shadow-sm bg-gray-50"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-lg">{roomItem.room_name}</p>
                                                        <p className="text-sm text-gray-600 mt-0.5">
                                                            {bookingType === 'day_tour' 
                                                                ? `${formatCurrency(roomItem.room_price)} per person • ${roomItem.total_guests} guest${roomItem.total_guests > 1 ? 's' : ''}`
                                                                : `${formatCurrency(roomItem.room_price)} / night • ${nights} night${nights > 1 ? "s" : ""}`
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {bookingType === 'day_tour' 
                                                                ? `Max ${roomItem.max_guests_range || roomItem.max_guests} guests`
                                                                : `Max ${roomItem.max_guests} guests${roomItem.extra_guests > 0 ? ` (+${roomItem.extra_guests} extra)` : ''}`
                                                            }
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => removeRoom(roomItem.uniqueId)}
                                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                                    >
                                                        <Trash size={18} />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-2">
                                                    <div>
                                                        <label htmlFor={`adults-${roomItem.uniqueId}`} className="block text-sm font-medium mb-1">Adults</label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={roomItem.adults}
                                                            onChange={(e) => updateRoomGuests(roomItem.uniqueId, 'adults', parseInt(e.target.value) || 0)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`children-${roomItem.uniqueId}`} className="block text-sm font-medium mb-1">Children</label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={roomItem.children}
                                                            onChange={(e) => updateRoomGuests(roomItem.uniqueId, 'children', parseInt(e.target.value) || 0)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-sm mt-4">
                                                    <span>{bookingType === 'day_tour' ? 'Day Tour Price:' : 'Room Price:'}</span>
                                                    <span>
                                                        {bookingType === 'day_tour' 
                                                            ? `${formatCurrency(roomItem.room_price)} × ${roomItem.total_guests} guest${roomItem.total_guests > 1 ? 's' : ''} = ${formatCurrency(roomItem.room_price * roomItem.total_guests)}`
                                                            : `${formatCurrency(roomItem.room_price)} x ${nights} night${nights > 1 ? "s" : ""} = ${formatCurrency(roomItem.room_price * nights)}`
                                                        }
                                                    </span>
                                                </div>
                                                
                                                {/* Extra Guest Warning for Overnight Bookings - Only show if exceeds base capacity */}
                                                {bookingType === 'overnight' && roomItem.total_guests > parseInt(roomItem.max_guests) && (
                                                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                                                        ⚠️ You have {roomItem.total_guests - parseInt(roomItem.max_guests)} extra guest{roomItem.total_guests - parseInt(roomItem.max_guests) > 1 ? 's' : ''}.
                                                        {mealQuote?.nights?.some(night => night.type === 'buffet') && (
                                                            <> Extra guest fees will apply on buffet days.</>
                                                        )}
                                                        {mealQuote?.nights?.some(night => night.type === 'free_breakfast') && (
                                                            <> Additional breakfast fees may apply on free breakfast days.</>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Day Tour Meal Options - Following Cart Implementation */}
                                                {bookingType === 'day_tour' && dayTourMealData && (
                                                    <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Meal Add-ons</h5>
                                                        
                                                        {/* Buffet Lunch Option */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`lunch-${roomItem.uniqueId}`}
                                                                    checked={roomItem.include_lunch || false}
                                                                    onChange={(e) => updateRoomGuests(roomItem.uniqueId, 'include_lunch', e.target.checked)}
                                                                    disabled={!dayTourMealData.buffet_active}
                                                                    className="rounded cursor-pointer"
                                                                />
                                                                <div>
                                                                    <label htmlFor={`lunch-${roomItem.uniqueId}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                                        Buffet Lunch
                                                                        {!dayTourMealData.buffet_active && (
                                                                            <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                                                        )}
                                                                    </label>
                                                                    {roomItem.include_lunch && dayTourMealData.lunch_prices && (
                                                                        <div className="text-xs text-gray-600">
                                                                            {roomItem.adults} adult{roomItem.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.lunch_prices.adult)}
                                                                            {roomItem.children > 0 && (
                                                                                <> + {roomItem.children} child{roomItem.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.lunch_prices.child)}</>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {roomItem.include_lunch && dayTourMealData.lunch_prices ? 
                                                                    formatCurrency((roomItem.adults * dayTourMealData.lunch_prices.adult) + (roomItem.children * dayTourMealData.lunch_prices.child)) 
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* PM Snack Option */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`pmSnack-${roomItem.uniqueId}`}
                                                                    checked={roomItem.include_pm_snack || false}
                                                                    onChange={(e) => updateRoomGuests(roomItem.uniqueId, 'include_pm_snack', e.target.checked)}
                                                                    disabled={dayTourMealData.pm_snack_policy === 'hidden'}
                                                                    className="rounded cursor-pointer"
                                                                />
                                                                <div>
                                                                    <label htmlFor={`pmSnack-${roomItem.uniqueId}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                                        PM Snack
                                                                        {dayTourMealData.pm_snack_policy === 'hidden' && (
                                                                            <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                                                                        )}
                                                                        {dayTourMealData.pm_snack_policy === 'required' && (
                                                                            <span className="ml-2 text-xs text-orange-600">(Required)</span>
                                                                        )}
                                                                    </label>
                                                                    {roomItem.include_pm_snack && dayTourMealData.pm_snack_prices && (
                                                                        <div className="text-xs text-gray-600">
                                                                            {roomItem.adults} adult{roomItem.adults > 1 ? 's' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.adult)}
                                                                            {roomItem.children > 0 && (
                                                                                <> + {roomItem.children} child{roomItem.children > 1 ? 'ren' : ''} × {formatCurrency(dayTourMealData.pm_snack_prices.child)}</>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {roomItem.include_pm_snack && dayTourMealData.pm_snack_prices ? 
                                                                    formatCurrency((roomItem.adults * dayTourMealData.pm_snack_prices.adult) + (roomItem.children * dayTourMealData.pm_snack_prices.child)) 
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                        
                                                        {(() => {
                                                            const lunchCost = roomItem.include_lunch && dayTourMealData.lunch_prices ? 
                                                                (roomItem.adults * dayTourMealData.lunch_prices.adult) + (roomItem.children * dayTourMealData.lunch_prices.child) : 0;
                                                            const pmSnackCost = roomItem.include_pm_snack && dayTourMealData.pm_snack_prices ? 
                                                                (roomItem.adults * dayTourMealData.pm_snack_prices.adult) + (roomItem.children * dayTourMealData.pm_snack_prices.child) : 0;
                                                            const mealCost = lunchCost + pmSnackCost;
                                                            
                                                            return mealCost > 0 && (
                                                                <div className="flex justify-between font-medium pt-2 border-t border-gray-300">
                                                                    <span>Meal Total:</span>
                                                                    <span className="text-blue-600">{formatCurrency(mealCost)}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Overnight Meal Information */}
                                                {bookingType === 'overnight' && mealQuote && mealQuote.nights && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                        <h6 className="text-sm font-medium text-blue-700 mb-2">Meal Programs for Selected Dates</h6>
                                                        <div className="space-y-2">
                                                            {mealQuote.nights.length > 0 ? (
                                                                mealQuote.nights.map((night, index) => (
                                                                    <div key={`night-${index}-${night.date}`} className="text-xs text-blue-600">
                                                                        {night.type === 'buffet' ? 'Buffet meals' : 'Free breakfast'} 
                                                                        {night.type === 'buffet' 
                                                                            ? (night.date && ` (${night.date})`)
                                                                            : (night.end_date && ` (${night.end_date})`)
                                                                        }
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-xs text-gray-600">No meal programs available for selected dates</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-between font-medium">
                                                    <span>Subtotal:</span>
                                                    <span>
                                                        {(() => {
                                                            let subtotal = bookingType === 'day_tour' 
                                                                ? (roomItem.room_price * roomItem.total_guests)
                                                                : (roomItem.room_price * nights);
                                                            
                                                            if (bookingType === 'day_tour' && dayTourMealData) {
                                                                const lunchCost = roomItem.include_lunch && dayTourMealData.lunch_prices ? 
                                                                    (roomItem.adults * dayTourMealData.lunch_prices.adult) + (roomItem.children * dayTourMealData.lunch_prices.child) : 0;
                                                                const pmSnackCost = roomItem.include_pm_snack && dayTourMealData.pm_snack_prices ? 
                                                                    (roomItem.adults * dayTourMealData.pm_snack_prices.adult) + (roomItem.children * dayTourMealData.pm_snack_prices.child) : 0;
                                                                subtotal += lunchCost + pmSnackCost;
                                                            }
                                                            
                                                            return formatCurrency(subtotal);
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Total Guests:</span>
                                                    <span>{roomItem.total_guests}</span>
                                                </div>

                                                {/* Guest validation warnings - similar to cart */}
                                                {(() => {
                                                    const totalGuests = roomItem.adults + roomItem.children;
                                                    const minGuests = roomItem.min_guests || 1;
                                                    const maxGuests = roomItem.max_guests_range || roomItem.max_guests || 10;
                                                    
                                                    if (totalGuests < minGuests) {
                                                        return (
                                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                                                                <p className="text-sm text-orange-800">
                                                                    <strong>Minimum {minGuests} guests required</strong> for this facility. 
                                                                    You currently have {totalGuests} guest{totalGuests !== 1 ? 's' : ''} selected.
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    if (totalGuests > maxGuests) {
                                                        return (
                                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                                                                <p className="text-sm text-red-800">
                                                                    <strong>Maximum {maxGuests} guests allowed</strong> for this facility. 
                                                                    You currently have {totalGuests} guest{totalGuests !== 1 ? 's' : ''} selected.
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return null;
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Booking Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Booking Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Booking Type:</span>
                                    <Badge variant={bookingType === 'day_tour' ? 'default' : 'secondary'}>
                                        {bookingType === 'day_tour' ? 'Day Tour' : 'Overnight'}
                                    </Badge>
                                </div>
                                
                                {bookingType === 'overnight' && nights > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Nights:</span>
                                        <span className="text-sm font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        {bookingType === 'day_tour' ? 'Day Tour Date:' : 'Check-in Date:'}
                                    </span>
                                    <span className="text-sm font-medium">{today}</span>
                                </div>

                                {bookingType === 'overnight' && nights && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Check-out Date:</span>
                                        <span className="text-sm font-medium">{getCheckOutDate()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        {bookingType === 'day_tour' ? 'Facilities:' : 'Total Rooms:'}
                                    </span>
                                    <span className="text-sm font-medium">{selectedRooms.length}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Guests:</span>
                                    <span className="text-sm font-medium">
                                        {selectedRooms.reduce((sum, roomItem) => sum + roomItem.adults + roomItem.children, 0)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                        {bookingType === 'day_tour' ? 'Day Tour Total:' : 'Room Total:'}
                                    </span>
                                    <span className="text-sm font-medium">
                                        {formatCurrency(totals.roomTotal)}
                                    </span>
                                </div>

                                {totals.mealTotal > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Meal Total:</span>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(totals.mealTotal)}
                                        </span>
                                    </div>
                                )}

                                {/* Detailed Meal Breakdown for Overnight Bookings */}
                                {bookingType === 'overnight' && mealQuote && mealQuote.nights && !mealCalculationLoading && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Meal Breakdown</h4>
                                        <div className="space-y-4">
                                            {mealQuote.nights.map((night, index) => (
                                                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                                                    {night.type === 'buffet' ? (
                                                        <>
                                                            {/* Date Header for Buffet */}
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {formatBuffetDateRange(night.start_date, night.end_date)} - Buffet
                                                                </span>
                                                                <span className="text-sm font-semibold text-gray-900">
                                                                    {formatCurrency(night.night_total)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* Simplified Free Breakfast Display */
                                                        <div className="text-sm font-medium text-gray-700">
                                                            <div>
                                                                {formatMealDate(night.end_date)} - Free Breakfast
                                                            </div>
                                                            <div className="text-green-600 font-semibold">
                                                                {(night.adults || 0) + (night.children || 0)} Guest{((night.adults || 0) + (night.children || 0)) > 1 ? 's' : ''} Complimentary Breakfast (Plated)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {/* Extra Guest Fees (Buffet Days) */}
                                            {mealQuote.nights.some(night => night.type === 'buffet' && night.extra_guest_fee > 0) && (() => {
                                                // Calculate total extra guests across all rooms
                                                const totalExtraGuests = selectedRooms.reduce((roomTotal, item) => {
                                                    const extraGuestsInRoom = Math.max(0, (item.adults + item.children) - parseInt(item.max_guests));
                                                    return roomTotal + extraGuestsInRoom;
                                                }, 0);
                                                
                                                return (
                                                    <div className="space-y-3">
                                                        {mealQuote.nights
                                                            .filter(night => night.type === 'buffet' && night.extra_guest_fee > 0)
                                                            .map((night, index) => {
                                                                const extraGuestFeeTotal = totalExtraGuests * night.extra_guest_fee;
                                                                
                                                                return (
                                                                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                                                                        {/* Date Header for Extra Guest Fee */}
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm font-medium text-gray-700">
                                                                                {formatBuffetDate(night.date)} - Extra Guest ({totalExtraGuests})
                                                                            </span>
                                                                            <span className="text-sm font-semibold text-gray-900">
                                                                                {formatCurrency(extraGuestFeeTotal)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Promo Code Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Promo code"
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput(e.target.value)}
                                            className="flex-1"
                                        />
                                        {promoInfo ? (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    clearPromo();
                                                    setPromoCodeInput('');
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button 
                                                type="button" 
                                                size="sm"
                                                onClick={() => handleApplyPromo()}
                                                disabled={!promoCodeInput.trim()}
                                            >
                                                Apply
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {promoError && (
                                        <p className="text-xs text-red-600">{promoError}</p>
                                    )}
                                    
                                    {promoInfo && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-green-600">
                                                Promo "{promoInfo.code}" applied – {promoInfo.discount_type === 'percentage'
                                                    ? `${promoInfo.discount_value}% off`
                                                    : `${formatCurrency(promoInfo.discount_value)} off`}
                                                {promoInfo.scope !== 'total' && ` (${promoInfo.scope} only)`}
                                            </p>
                                            
                                            {/* Per-night breakdown for promos with excluded days */}
                                            {promoInfo.perNightBreakdown && bookingType === 'overnight' && (
                                                <div className="mt-2 p-2 bg-blue-50 rounded text-xs space-y-1">
                                                    <p className="font-medium text-blue-800">Per-night discount breakdown:</p>
                                                    {promoInfo.perNightBreakdown.map((night, idx) => (
                                                        <div key={idx} className="flex justify-between text-blue-700">
                                                            <span>
                                                                {night.dayName} ({night.date})
                                                                {!night.eligible && <span className="text-orange-600 ml-1">(excluded)</span>}
                                                            </span>
                                                            <span className={night.eligible ? 'text-green-600' : 'text-gray-400'}>
                                                                {night.eligible ? formatCurrency(night.discountAmount) : '—'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Subtotal:</span>
                                        <span className="text-sm font-medium">{formatCurrency(totals.total)}</span>
                                    </div>
                                    
                                    {promoInfo && promoInfo.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Promo Discount ({promoInfo.code}):</span>
                                            <span>-{formatCurrency(promoInfo.discountAmount)}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total Amount:</span>
                                        <span>
                                            {formatCurrency(
                                                promoInfo && promoInfo.discountAmount
                                                    ? Math.max(0, totals.total - promoInfo.discountAmount)
                                                    : totals.total
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/admin/bookings')}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="walkin-booking-form"
                                        disabled={loading || selectedRooms.length === 0 || (() => {
                                            // Check if any room has validation errors
                                            return selectedRooms.some(roomItem => {
                                                const totalGuests = roomItem.adults + roomItem.children;
                                                const minGuests = roomItem.min_guests || 1;
                                                const maxGuests = roomItem.max_guests_range || roomItem.max_guests || 10;
                                                return totalGuests < minGuests || totalGuests > maxGuests;
                                            });
                                        })()}
                                        className="flex-1"
                                    >
                                        {loading ? 'Creating Booking...' : 'Create Walk-In Booking'}
                                    </Button>
                                </div>
                            </div>

                            {mealLoading && (
                                <div className="text-center py-2">
                                    <p className="text-sm text-gray-500">Loading meal quote...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default WalkInBooking;
