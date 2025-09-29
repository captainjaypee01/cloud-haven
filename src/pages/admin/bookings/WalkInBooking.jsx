import React, { useState, useEffect } from 'react';
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

// Form validation schema
const FormSchema = z.object({
    booking_type: z.enum(['day_tour', 'overnight'], {
        required_error: "Please select a booking type",
    }),
    nights: z.number().min(1).max(5).optional(),
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
});

const WalkInBooking = () => {
    const navigate = useNavigate();
    const api = useApi();
    
    const [loading, setLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [dayTourMealData, setDayTourMealData] = useState(null);
    const [dayTourPricing, setDayTourPricing] = useState(null);
    const [mealLoading, setMealLoading] = useState(false);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            booking_type: 'day_tour',
            nights: 1,
            guest_name: '',
            guest_email: '',
            guest_phone: '',
            special_requests: '',
            rooms: [],
        }
    });

    const bookingType = form.watch('booking_type');
    const nights = form.watch('nights');

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

    // Fetch meal data and pricing based on booking type
    useEffect(() => {
        if (bookingType === 'day_tour') {
            fetchDayTourMealData();
            fetchDayTourPricing();
        } else if (bookingType === 'overnight' && nights) {
            fetchOvernightMealQuote();
        } else {
            setDayTourMealData(null);
            setDayTourPricing(null);
        }
    }, [bookingType, nights]);

    // Fetch available rooms when booking type or nights change
    useEffect(() => {
        fetchAvailableRooms();
        // Clear selected rooms when booking type changes
        setSelectedRooms([]);
    }, [bookingType, nights]);

    const fetchAvailableRooms = async () => {
        setAvailabilityLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let response;

            if (bookingType === 'day_tour') {
                // For day tours, use the day tour availability endpoint
                response = await api.get(`${API_PREFIX}/day-tours/availability`, {
                    params: { date: today }
                });
                // The response structure is different for day tour availability
                setRooms(response?.data?.rooms || []);
            } else {
                // For overnight bookings, use the regular rooms endpoint with availability
                let checkOutDate;
                if (nights) {
                    checkOutDate = new Date(Date.now() + (nights * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
                } else {
                    checkOutDate = today;
                }

                response = await api.get(`${API_PREFIX}/rooms`, {
                    params: { check_in: today, check_out: checkOutDate }
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
            const today = new Date().toISOString().split('T')[0];
            const mealData = await fetchDayTourAvailability(api, today);
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
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`${API_PREFIX}/day-tours/pricing`, {
                params: { date: today }
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
            const today = new Date().toISOString().split('T')[0];
            const checkOutDate = new Date(Date.now() + (nights * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
            
            const response = await api.post(`${API_PREFIX}/meals/quote`, {
                check_in: today,
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
        const availableUnits = room.available_units || 0;
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
            : room.price_per_night;
        
        // Use correct guest limits based on booking type
        const defaultAdults = bookingType === 'day_tour' 
            ? Math.min(room.min_guests || 2, room.max_guests || 10)
            : (room.max_occupancy || 2);
        
        const newRoomItem = {
            uniqueId,
            room_id: roomId,
            room_name: roomName,
            room_price: roomPrice,
            adults: defaultAdults,
            children: 0,
            total_guests: defaultAdults,
            addedAt: new Date(addedAt),
            // Store room limits for validation
            min_guests: room.min_guests || 1,
            max_guests: room.max_guests || 10,
            max_guests_range: room.max_guests_range || room.max_guests || 10,
            available_units: availableUnits
        };
        setSelectedRooms(prev => [...prev, newRoomItem]);
        toast.success(`Added ${roomName} to booking`);
    };

    const removeRoom = (uniqueId) => {
        setSelectedRooms(prev => prev.filter(r => r.uniqueId !== uniqueId));
    };

    const updateRoomGuests = (uniqueId, field, value) => {
        setSelectedRooms(prev => prev.map(r => 
            r.uniqueId === uniqueId 
                ? { ...r, [field]: value, total_guests: (field === 'adults' ? value : r.adults) + (field === 'children' ? value : r.children) }
                : r
        ));
    };

    const calculateTotal = () => {
        const numNights = bookingType === 'overnight' ? nights : 0;
        let roomTotal = 0;

        selectedRooms.forEach(roomItem => {
            if (bookingType === 'day_tour') {
                // For day tours, use the stored room price
                roomTotal += roomItem.room_price;
            } else {
                // For overnight bookings, use per night pricing
                roomTotal += roomItem.room_price * numNights;
            }
        });

        let mealTotal = 0;
        if (dayTourMealData && selectedRooms.length > 0) {
            if (bookingType === 'day_tour') {
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
                // For overnight bookings, use the meal quote API data
                if (dayTourMealData.nights && Array.isArray(dayTourMealData.nights)) {
                    dayTourMealData.nights.forEach(night => {
                        let nightTotal = 0;
                        
                        if (night.type === 'buffet') {
                            // Buffet: charge all guests
                            selectedRooms.forEach(roomItem => {
                                nightTotal += (roomItem.adults * (night.adult_price || 0)) + 
                                             (roomItem.children * (night.child_price || 0));
                            });
                        } else if (night.type === 'free_breakfast') {
                            // Free breakfast: charge extra guests only
                            selectedRooms.forEach(roomItem => {
                                const totalGuestsInRoom = roomItem.adults + roomItem.children;
                                const maxGuests = roomItem.max_guests || 2;
                                const extraGuestsInRoom = Math.max(0, totalGuestsInRoom - maxGuests);
                                
                                if (extraGuestsInRoom > 0) {
                                    nightTotal += extraGuestsInRoom * (night.adult_breakfast_price || 0);
                                }
                            });
                        }
                        
                        mealTotal += nightTotal;
                    });
                }
            }
        }

        return {
            roomTotal,
            mealTotal,
            total: roomTotal + mealTotal,
            numNights
        };
    };

    const onSubmit = async (data) => {
        console.log('Form submitted with data:', data);
        console.log('Selected rooms:', selectedRooms);
        
        if (selectedRooms.length === 0) {
            toast.error("Please select at least one room");
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
    const today = new Date().toLocaleDateString();

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
                                Booking for today only: {today}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                                {/* Nights Selection (for overnight only) */}
                                {bookingType === 'overnight' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="nights">Number of Nights *</Label>
                                        <Select
                                            value={nights?.toString()}
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
                                    <h3 className="text-lg font-semibold">Room Selection</h3>
                                    
                                    {availabilityLoading ? (
                                        <div className="text-center py-4">
                                            <p>Loading available rooms...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {rooms.map((room, index) => {
                                                // Handle different room structures for day tour vs overnight
                                                // For day tour: room_id, for overnight: slug
                                                const roomId = room.room_id || room.roomId || room.slug || room.id || `room-${index}`;
                                                const roomName = room.name;
                                                const maxGuests = bookingType === 'day_tour' 
                                                    ? (room.max_guests_range || room.max_guests)
                                                    : room.max_occupancy;
                                                const totalAvailableUnits = room.available_units || 0;
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
                                                                    <p className="text-sm text-gray-600">{room.description || 'Day Tour facility'}</p>
                                                                </div>
                                                                <Badge variant="secondary">
                                                                    {bookingType === 'day_tour' 
                                                                        ? formatCurrency(dayTourPricing?.price_per_pax || room.price_per_pax || room.base_price)
                                                                        : `${formatCurrency(room.price_per_night)}/night`
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4" />
                                                                    {bookingType === 'day_tour' 
                                                                        ? `${minGuests}-${maxGuests} guests`
                                                                        : `Max ${maxGuests} guests`
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Bed className="h-4 w-4" />
                                                                    {room.roomType || room.room_type}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span className={remainingUnits <= 0 ? 'text-red-600 font-medium' : ''}>
                                                                        {remainingUnits} of {totalAvailableUnits} available
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
                                                                {remainingUnits <= 0 ? 'Not Available' : 'Add Room'}
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
                                        <h3 className="text-lg font-semibold">Selected Rooms ({selectedRooms.length})</h3>
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
                                                        <p className="text-xs text-gray-500">Max {roomItem.max_guests_range || roomItem.max_guests} guests</p>
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
                                                {bookingType === 'overnight' && dayTourMealData && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                        <h6 className="text-sm font-medium text-blue-700 mb-2">Meal Programs for Selected Dates</h6>
                                                        <div className="space-y-2">
                                                            {dayTourMealData.nights && dayTourMealData.nights.length > 0 ? (
                                                                dayTourMealData.nights.map((night, index) => (
                                                                    <div key={`night-${index}-${night.date}`} className="text-xs text-blue-600">
                                                                        {night.type === 'buffet' ? 'Buffet meals' : 'Free breakfast'} 
                                                                        {night.date && ` (${night.date})`}
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

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/admin/bookings')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || selectedRooms.length === 0 || (() => {
                                            // Check if any room has validation errors
                                            return selectedRooms.some(roomItem => {
                                                const totalGuests = roomItem.adults + roomItem.children;
                                                const minGuests = roomItem.min_guests || 1;
                                                const maxGuests = roomItem.max_guests_range || roomItem.max_guests || 10;
                                                return totalGuests < minGuests || totalGuests > maxGuests;
                                            });
                                        })()}
                                    >
                                        {loading ? 'Creating Booking...' : 'Create Walk-In Booking'}
                                    </Button>
                                </div>
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
                                
                                {bookingType === 'overnight' && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Nights:</span>
                                        <span className="text-sm font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Check-in Date:</span>
                                    <span className="text-sm font-medium">{today}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Rooms:</span>
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
                                    <span className="text-sm text-gray-600">Room Total:</span>
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

                                <Separator />

                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(totals.total)}</span>
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
