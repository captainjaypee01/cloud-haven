import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Users, User, Baby, Loader2, Home, Calendar, AlertTriangle } from 'lucide-react';
import { useBookingModification } from '@/hooks/useBookingModification';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { GuestSelector } from '@/components/GuestSelector';

const BookingRoomModificationDialog = ({ 
    open, 
    onOpenChange, 
    booking, 
    onSuccess 
}) => {
    const [availableRooms, setAvailableRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [availableUnits, setAvailableUnits] = useState({}); // room_slug -> units array
    const [loadingUnits, setLoadingUnits] = useState({}); // room_slug -> loading state
    const [initialRoomsData, setInitialRoomsData] = useState([]); // Store initial room data
    const { modifyBooking, isLoading } = useBookingModification();
    const api = useApi();

    const form = useForm({
        defaultValues: {
            rooms: [],
            modification_reason: '',
            send_email: false
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'rooms'
    });

    // Initialize form with current booking rooms
    useEffect(() => {
        if (booking && open) {
            const initialRooms = booking.booking_rooms?.map(br => ({
                room_id: br.room?.slug || '',
                adults: br.adults || 1,
                children: br.children || 0,
                total_guests: br.total_guests || 1,
                room_name: br.room?.name || '',
                price_per_night: br.price_per_night || 0,
                room_unit_id: br.room_unit_id || null, // Use room_unit_id directly
                room_unit_number: br.room_unit?.unit_number || ''
            })) || [];
            
            
            form.reset({
                rooms: initialRooms,
                modification_reason: '',
                send_email: false
            });
            
            // Store initial rooms data for reference
            setInitialRoomsData(initialRooms);
        }
    }, [booking, open, form]);

    // Load available rooms and units when dialog opens
    useEffect(() => {
        if (open && booking) {
            loadAvailableRooms();
        }
    }, [open, booking]);

    // Load units for existing rooms after available rooms are loaded
    useEffect(() => {
        if (availableRooms.length > 0 && booking && open) {
            const currentRooms = form.getValues('rooms');
            
            // Load units for each room type
            currentRooms.forEach((room, index) => {
                if (room.room_id) {
                    const bookingRoom = booking.booking_rooms?.find(br => br.room?.slug === room.room_id);
                    if (bookingRoom?.room?.id) {
                        loadAvailableUnits(bookingRoom.room.id, room.room_id, index);
                    }
                }
            });
        }
    }, [availableRooms, booking, open]);

    // Re-initialize form with correct data after available rooms are loaded
    useEffect(() => {
        if (availableRooms.length > 0 && initialRoomsData.length > 0 && booking && open) {
            // Update form with correct room data from available rooms
            const updatedRooms = initialRoomsData.map(initialRoom => {
                const availableRoom = availableRooms.find(ar => ar.slug === initialRoom.room_id);
                if (availableRoom) {
                    return {
                        ...initialRoom,
                        room_name: availableRoom.name,
                        price_per_night: availableRoom.price_per_night // Use current room price from API
                    };
                }
                return initialRoom;
            });
            
            
            // Only reset if the data has actually changed
            const currentRooms = form.getValues('rooms');
            const hasChanges = updatedRooms.some((updatedRoom, index) => {
                const currentRoom = currentRooms[index];
                return !currentRoom || 
                       updatedRoom.room_name !== currentRoom.room_name ||
                       updatedRoom.price_per_night !== currentRoom.price_per_night;
            });
            
            if (hasChanges) {
                form.reset({
                    rooms: updatedRooms,
                    modification_reason: '',
                    send_email: false
                });
            }
        }
    }, [availableRooms, initialRoomsData, booking, open, form]);

    const loadAvailableRooms = async () => {
        setIsLoadingRooms(true);
        try {
            const response = await api.get(`${API_PREFIX}/rooms`, { requiresAuth: true });
            
            // Transform the data to match expected structure
            const rooms = (response.data.data || []).map(room => ({
                ...room,
                price_per_night: room.price, // Map price to price_per_night
                // Keep the original structure but add price_per_night for consistency
            }));
            
            setAvailableRooms(rooms);
        } catch (error) {
            console.error('Failed to load rooms:', error);
            toast.error('Failed to load available rooms');
        } finally {
            setIsLoadingRooms(false);
        }
    };

    const addRoom = () => {
        append({
            room_id: '',
            adults: 1,
            children: 0,
            total_guests: 1,
            room_name: '',
            price_per_night: 0,
            room_unit_id: null,
            room_unit_number: ''
        });
    };

    const removeRoom = (index) => {
        if (fields.length > 1) {
            remove(index);
        } else {
            toast.error('At least one room is required');
        }
    };

    const handleRoomChange = (index, roomSlug) => {
        const selectedRoom = availableRooms.find(room => room.slug === roomSlug);
        if (selectedRoom) {
            form.setValue(`rooms.${index}.room_name`, selectedRoom.name);
            form.setValue(`rooms.${index}.price_per_night`, selectedRoom.price_per_night);
            // Clear room unit when room changes
            form.setValue(`rooms.${index}.room_unit_id`, null);
            form.setValue(`rooms.${index}.room_unit_number`, '');
            
            // Load available units for this room type
            // For existing rooms, use the booking room's ID
            // For new rooms, use the selected room's ID from availableRooms
            const bookingRoom = booking.booking_rooms?.find(br => br.room?.slug === roomSlug);
            const roomId = bookingRoom?.room?.id || selectedRoom.id;
            
            if (roomId) {
                loadAvailableUnits(roomId, roomSlug, index);
            }
        }
    };

    const loadAvailableUnits = async (roomId, roomSlug, currentRoomIndex) => {
        
        if (!booking || !roomId) {
            return;
        }
        
        setLoadingUnits(prev => ({ ...prev, [roomSlug]: true }));
        
        try {
            const checkInDate = booking.check_in_date;
            const checkOutDate = booking.booking_type === 'day_tour' ? booking.check_in_date : booking.check_out_date;
            
            const response = await api.get(
                `${API_PREFIX}/admin/bookings/${booking.id}/available-room-units`,
                {
                    requiresAuth: true,
                    params: { room_id: roomId, check_in_date: checkInDate, check_out_date: checkOutDate }
                }
            );
            
            const apiUnits = (response.data.available_units || []).filter(unit => 
                unit && unit.id && unit.unit_number
            );
            
            // Get units already assigned in the original booking
            const assignedUnitIds = booking.booking_rooms
                ?.filter(br => br.room_unit)
                ?.map(br => br.room_unit.id) || [];
            
            // Get the current room's assigned unit from the form data
            const currentFormRoom = form.getValues(`rooms.${currentRoomIndex}`);
            const currentRoomUnitId = currentFormRoom?.room_unit_id;
            const currentRoomUnitNumber = currentFormRoom?.room_unit_number;
            
            let finalUnits = [];
            
            if (currentRoomUnitId && currentRoomUnitNumber) {
                // For existing rooms: include their current unit + available units
                const currentUnit = {
                    id: currentRoomUnitId,
                    unit_number: currentRoomUnitNumber,
                    status: 'assigned',
                    notes: 'Currently assigned'
                };
                
                // Add available units that are not assigned to other rooms
                const availableUnits = apiUnits.filter(unit => 
                    !assignedUnitIds.includes(unit.id)
                );
                
                finalUnits = [currentUnit, ...availableUnits];
            } else {
                // For new rooms: only show truly available units
                finalUnits = apiUnits.filter(unit => 
                    !assignedUnitIds.includes(unit.id)
                );
            }
            
            setAvailableUnits(prev => ({ ...prev, [`${roomSlug}_${currentRoomIndex}`]: finalUnits }));
            
        } catch (error) {
            console.error('Failed to load units:', error);
            setAvailableUnits(prev => ({ ...prev, [`${roomSlug}_${currentRoomIndex}`]: [] }));
        } finally {
            setLoadingUnits(prev => ({ ...prev, [roomSlug]: false }));
        }
    };

    const handleRoomUnitChange = (index, unitId) => {
        const roomSlug = form.getValues(`rooms.${index}.room_id`);
        const units = availableUnits[`${roomSlug}_${index}`] || [];
        const selectedUnit = units.find(unit => unit.id.toString() === unitId);
        
        if (selectedUnit) {
            form.setValue(`rooms.${index}.room_unit_id`, parseInt(unitId));
            form.setValue(`rooms.${index}.room_unit_number`, selectedUnit.unit_number);
        }
        
        // Clear validation errors
        form.clearErrors(`rooms.${index}.room_unit_id`);
    };

    const handleGuestCountChange = (index, field, value) => {
        const currentRoom = form.getValues(`rooms.${index}`);
        const newValue = parseInt(value) || 0;
        
        form.setValue(`rooms.${index}.${field}`, newValue);
        
        // Update total guests
        if (field === 'adults' || field === 'children') {
            const adults = field === 'adults' ? newValue : currentRoom.adults;
            const children = field === 'children' ? newValue : currentRoom.children;
            form.setValue(`rooms.${index}.total_guests`, adults + children);
        }
    };

    const onSubmit = async (data) => {
        try {
            
            // Clear any previous validation errors
            form.clearErrors();

            // Validate that all rooms have room_id selected
            const hasEmptyRooms = data.rooms.some(room => !room.room_id);
            if (hasEmptyRooms) {
                toast.error('Please select a room for all entries');
                return;
            }

            // Validate room capacity
            const hasCapacityExceeded = data.rooms.some((room, index) => {
                const availableRoom = availableRooms.find(ar => ar.slug === room.room_id);
                if (availableRoom) {
                    const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                    return room.total_guests > maxCapacity;
                }
                return false;
            });

            if (hasCapacityExceeded) {
                // Find which rooms exceed capacity and set form errors
                data.rooms.forEach((room, index) => {
                    const availableRoom = availableRooms.find(ar => ar.slug === room.room_id);
                    if (availableRoom) {
                        const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                        if (room.total_guests > maxCapacity) {
                            form.setError(`rooms.${index}.total_guests`, {
                                type: 'capacity_exceeded',
                                message: `Room '${availableRoom.name}' can accommodate maximum ${maxCapacity} guests (Max: ${availableRoom.max_guests}, Extra: ${availableRoom.extra_guests || 0}). You have ${room.total_guests} guests.`
                            });
                        }
                    }
                });
                
                toast.error('Some rooms exceed their maximum guest capacity');
                return;
            }

            // Validate that all rooms have room_unit_id selected (required)
            const hasEmptyUnits = data.rooms.some(room => !room.room_unit_id);
            if (hasEmptyUnits) {
                // Find which rooms don't have units selected and set form errors
                data.rooms.forEach((room, index) => {
                    if (!room.room_unit_id) {
                        form.setError(`rooms.${index}.room_unit_id`, {
                            type: 'required',
                            message: 'Please select a room unit for this room'
                        });
                    }
                });
                
                toast.error('Please select a room unit for all rooms');
                return;
            }

            // Validate for duplicate unit selections and highlight problematic fields
            const selectedUnits = data.rooms
                .filter(room => room.room_unit_id) // Only rooms with selected units
                .map(room => room.room_unit_id);
            
            const duplicateUnits = selectedUnits.filter((unitId, index) => 
                selectedUnits.indexOf(unitId) !== index
            );
            
            if (duplicateUnits.length > 0) {
                // Find which rooms have duplicate units and set form errors
                const duplicateUnitIds = [...new Set(duplicateUnits)];
                
                data.rooms.forEach((room, index) => {
                    if (room.room_unit_id && duplicateUnitIds.includes(room.room_unit_id)) {
                        form.setError(`rooms.${index}.room_unit_id`, {
                            type: 'duplicate',
                            message: 'This room unit is already selected for another room'
                        });
                    }
                });
                
                toast.error(`Duplicate room unit selections found. Please select different units.`);
                return;
            }

            // Prepare data for API
            const modificationData = {
                rooms: data.rooms.map(room => ({
                    room_id: room.room_id,
                    adults: room.adults,
                    children: room.children,
                    total_guests: room.total_guests,
                    room_unit_id: room.room_unit_id || null
                })),
                modification_reason: data.modification_reason || null,
                send_email: data.send_email || false
            };

            await modifyBooking(booking.id, modificationData);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            // Error handling is done in the hook
        }
    };

    const calculateEstimatedTotal = () => {
        const rooms = form.getValues('rooms');
        if (!rooms.length) return 0;

        const nights = booking.booking_type === 'day_tour' ? 1 : 
            Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24));

        return rooms.reduce((total, room) => {
            if (room.room_id && room.price_per_night) {
                return total + (room.price_per_night * nights);
            }
            return total;
        }, 0);
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Modify Rooms & Guests
                    </DialogTitle>
                    <p className="text-sm text-gray-600">
                        Update room types, guest counts, and room units for booking #{booking.reference_number}
                    </p>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    })} className="space-y-6">
                        {/* Booking Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Booking Details</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Guest:</span>
                                    <span className="ml-2 font-medium">{booking.guest_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Type:</span>
                                    <Badge variant="secondary" className="ml-2">
                                        {booking.booking_type === 'day_tour' ? 'Day Tour' : 'Overnight'}
                                    </Badge>
                                </div>
                                {booking.booking_type === 'day_tour' ? (
                                    <div className="sm:col-span-2">
                                        <span className="text-gray-600">Tour Date:</span>
                                        <span className="ml-2 font-medium">{new Date(booking.check_in_date).toLocaleDateString()}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <span className="text-gray-600">Check-in:</span>
                                            <span className="ml-2 font-medium">{new Date(booking.check_in_date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Check-out:</span>
                                            <span className="ml-2 font-medium">{new Date(booking.check_out_date).toLocaleDateString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Room Management */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Rooms & Guests</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addRoom}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Room
                                </Button>
                            </div>

                            {fields.map((field, index) => {
                                const hasUnitError = form.formState.errors.rooms?.[index]?.room_unit_id;
                                return (
                                    <Card key={field.id} className={`border-l-4 ${hasUnitError ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500'}`}>
                                        <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium text-gray-900">Room {index + 1}</h4>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeRoom(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {/* Room Type Selection */}
                                            <FormField
                                                control={form.control}
                                                name={`rooms.${index}.room_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Room Type</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                handleRoomChange(index, value);
                                                            }}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select room type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                                <SelectContent>
                                                                    {availableRooms.map((room) => (
                                                                        <SelectItem key={room.slug} value={room.slug}>
                                                                            <div className="flex justify-between items-center w-full">
                                                                                <span>{room.name}</span>
                                                                                <span className="text-gray-500 ml-2">
                                                                                    {formatCurrency(room.price_per_night)}
                                                                                </span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Guest Counts */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`rooms.${index}.adults`}
                                                    render={({ field }) => {
                                                        const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                        const availableRoom = availableRooms.find(ar => ar.slug === roomSlug);
                                                        const maxCapacity = availableRoom ? (availableRoom.max_guests + (availableRoom.extra_guests || 0)) : 10;
                                                        
                                                        return (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-medium flex items-center gap-2">
                                                                    <User className="h-4 w-4" />
                                                                    Adults
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <GuestSelector
                                                                        name={`rooms.${index}.adults`}
                                                                        maxGuests={maxCapacity}
                                                                        minGuests={1}
                                                                        value={field.value?.toString()}
                                                                        defaultValue="1"
                                                                        onChange={(value) => {
                                                                            const numValue = parseInt(value);
                                                                            field.onChange(numValue);
                                                                            handleGuestCountChange(index, 'adults', numValue);
                                                                        }}
                                                                        isDialog={true}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`rooms.${index}.children`}
                                                    render={({ field }) => {
                                                        const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                        const availableRoom = availableRooms.find(ar => ar.slug === roomSlug);
                                                        const maxCapacity = availableRoom ? (availableRoom.max_guests + (availableRoom.extra_guests || 0)) : 10;
                                                        
                                                        return (
                                                            <FormItem>
                                                                <FormLabel className="text-sm font-medium flex items-center gap-2">
                                                                    <Baby className="h-4 w-4" />
                                                                    Children
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <GuestSelector
                                                                        name={`rooms.${index}.children`}
                                                                        maxGuests={maxCapacity}
                                                                        minGuests={0}
                                                                        value={field.value?.toString()}
                                                                        defaultValue="0"
                                                                        onChange={(value) => {
                                                                            const numValue = parseInt(value);
                                                                            field.onChange(numValue);
                                                                            handleGuestCountChange(index, 'children', numValue);
                                                                        }}
                                                                        isDialog={true}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            </div>

                                            {/* Capacity Warning */}
                                            {(() => {
                                                const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                const totalGuests = form.watch(`rooms.${index}.total_guests`);
                                                const availableRoom = availableRooms.find(ar => ar.slug === roomSlug);
                                                
                                                if (availableRoom && totalGuests) {
                                                    const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                                                    if (totalGuests > maxCapacity) {
                                                        return (
                                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2 text-red-700">
                                                                    <AlertTriangle className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">
                                                                        Capacity Exceeded
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-red-600 mt-1">
                                                                    This room can accommodate maximum {maxCapacity} guests 
                                                                    (Max: {availableRoom.max_guests}, Extra: {availableRoom.extra_guests || 0}). 
                                                                    You have {totalGuests} guests.
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}

                                            {/* Room Unit Selection */}
                                            <FormField
                                                control={form.control}
                                                name={`rooms.${index}.room_unit_id`}
                                                render={({ field, fieldState }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Room Unit <span className="text-red-500">*</span></FormLabel>
                                                        {loadingUnits[form.watch(`rooms.${index}.room_id`)] ? (
                                                            <div className="flex items-center justify-center p-3 border rounded-md bg-gray-50">
                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                <span className="text-sm text-gray-600">Loading units...</span>
                                                            </div>
                                                        ) : (
                                                            <Select
                                                                value={field.value ? field.value.toString() : ''}
                                                                onValueChange={(value) => {
                                                                    field.onChange(parseInt(value));
                                                                    handleRoomUnitChange(index, value);
                                                                }}
                                                                disabled={!form.watch(`rooms.${index}.room_id`)}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger 
                                                                        className={`w-full ${
                                                                            fieldState.error ? 'border-red-500 bg-red-50' : ''
                                                                        }`}
                                                                    >
                                                                        <SelectValue placeholder="Select unit (required)" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {(() => {
                                                                        const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                                        const units = availableUnits[`${roomSlug}_${index}`] || [];
                                                                        const currentUnitId = field.value;
                                                                        
                                                                        if (units.length === 0) {
                                                                            return (
                                                                                <div className="p-4 text-center text-gray-500">
                                                                                    {roomSlug ? 'No available units' : 'Select room first'}
                                                                                </div>
                                                                            );
                                                                        }
                                                                        
                                                                        return units
                                                                            .filter(unit => unit && unit.id && unit.unit_number)
                                                                            .map((unit) => (
                                                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                                                    Unit {unit.unit_number}
                                                                                    {unit.notes && ` (${unit.notes})`}
                                                                                    {currentUnitId === unit.id && ' (Current)'}
                                                                                </SelectItem>
                                                                            ));
                                                                    })()}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Room Summary */}
                                            <div className="bg-gray-50 rounded-lg p-3 border">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-gray-600" />
                                                            <span className="text-gray-600">Total Guests:</span>
                                                            <span className={`font-medium ${
                                                                (() => {
                                                                    const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                                    const totalGuests = form.watch(`rooms.${index}.total_guests`);
                                                                    const availableRoom = availableRooms.find(ar => ar.slug === roomSlug);
                                                                    if (availableRoom) {
                                                                        const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                                                                        return totalGuests > maxCapacity ? 'text-red-600' : 'text-gray-900';
                                                                    }
                                                                    return 'text-gray-900';
                                                                })()
                                                            }`}>
                                                                {form.watch(`rooms.${index}.total_guests`)}
                                                            </span>
                                                            {(() => {
                                                                const roomSlug = form.watch(`rooms.${index}.room_id`);
                                                                const availableRoom = availableRooms.find(ar => ar.slug === roomSlug);
                                                                if (availableRoom) {
                                                                    const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                                                                    return (
                                                                        <span className="text-xs text-gray-500">
                                                                            / {maxCapacity} max
                                                                        </span>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        <div className="text-right">
                                                            {form.watch(`rooms.${index}.room_name`) && (
                                                                <div className="text-gray-600">
                                                                    <span className="font-medium">
                                                                        {formatCurrency(form.watch(`rooms.${index}.price_per_night`))}
                                                                    </span>
                                                                    <span className="text-xs ml-1">
                                                                        {booking.booking_type === 'day_tour' ? '/person' : '/night'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {form.watch(`rooms.${index}.room_unit_number`) && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Home className="h-4 w-4 text-blue-600" />
                                                            <span className="text-gray-600">Assigned Unit:</span>
                                                            <span className="font-medium text-blue-700">
                                                                Unit {form.watch(`rooms.${index}.room_unit_number`)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                );
                            })}
                        </div>

                        {/* Estimated Total */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-green-900">Estimated Room Total:</span>
                                <span className="text-xl font-bold text-green-700">
                                    {formatCurrency(calculateEstimatedTotal())}
                                </span>
                            </div>
                            <p className="text-sm text-green-700 mt-2">
                                * Final price will include meals, extra guest fees, and any applicable discounts
                            </p>
                        </div>

                        {/* Modification Reason */}
                        <FormField
                            control={form.control}
                            name="modification_reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Modification Reason (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter reason for modification..."
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email Notification Toggle */}
                        <FormField
                            control={form.control}
                            name="send_email"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-medium">
                                            Send Email Notification
                                        </FormLabel>
                                        <div className="text-sm text-gray-600">
                                            Notify the guest about this booking modification via email
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isLoadingRooms}
                                className="w-full sm:w-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Modifying...
                                    </>
                                ) : (
                                    'Modify Booking'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BookingRoomModificationDialog;
