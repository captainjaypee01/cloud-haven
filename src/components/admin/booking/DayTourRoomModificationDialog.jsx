import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { GuestSelector } from '@/components/GuestSelector';
import { formatCurrency } from '@/utils/currency';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { Plus, Trash2, UtensilsCrossed, Coffee, Users, DollarSign } from 'lucide-react';
import { fetchDayTourAvailability, fetchCurrentDayTourPricing } from '@/services/dayTour';

const DayTourRoomModificationDialog = ({ 
    open, 
    onOpenChange, 
    booking, 
    onSuccess 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isLoadingUnits, setIsLoadingUnits] = useState({});
    const [availableRooms, setAvailableRooms] = useState([]);
    const [currentPricing, setCurrentPricing] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [roomUnits, setRoomUnits] = useState({});
    
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

    // Load Day Tour data when dialog opens
    useEffect(() => {
        if (open && booking) {
            loadDayTourData();
        }
    }, [open, booking]);

    // Load room units for existing rooms after available rooms are loaded
    useEffect(() => {
        if (availableRooms.length > 0 && booking && open) {
            const currentRooms = form.getValues('rooms');
            currentRooms.forEach((room, index) => {
                if (room.room_id) {
                    loadAvailableUnits(room.room_id, index);
                }
            });
        }
    }, [availableRooms, booking, open]);

    const loadDayTourData = async () => {
        setIsLoading(true);
        try {
            // Load Day Tour rooms, pricing, and availability
            const [roomsResponse, pricingData, availabilityData] = await Promise.all([
                api.get(`${API_PREFIX}/rooms`, { 
                    requiresAuth: true,
                    params: { room_type: 'day_tour' }
                }),
                fetchCurrentDayTourPricing(api, booking.check_in_date),
                fetchDayTourAvailability(api, booking.check_in_date)
            ]);

            setAvailableRooms(roomsResponse.data.data || []);
            setCurrentPricing(pricingData);
            setAvailability(availabilityData);
            
            // Initialize form after data is loaded
            initializeForm();
        } catch (error) {
            console.error('Failed to load Day Tour data:', error);
            toast.error('Failed to load Day Tour information');
        } finally {
            setIsLoading(false);
        }
    };

    const initializeForm = () => {
        if (!booking?.booking_rooms) return;

        const initialRooms = booking.booking_rooms.map(br => ({
            room_id: br.room?.slug || '',
            room_unit_id: br.room_unit?.id || null,
            adults: br.adults || 1,
            children: br.children || 0,
            include_lunch: br.include_lunch || false,
            include_pm_snack: br.include_pm_snack || false,
            room_name: br.room?.name || '',
            unit_number: br.room_unit?.unit_number || null
        }));

        form.reset({
            rooms: initialRooms,
            modification_reason: '',
            send_email: false
        });

        // Note: Room units will be loaded in a separate useEffect after availableRooms is set
    };

    const loadAvailableUnits = async (roomSlug, roomIndex) => {
        if (!booking || !roomSlug) return;
        
        setIsLoadingUnits(prev => ({ ...prev, [roomSlug]: true }));
        
        try {
            const room = availableRooms.find(r => r.slug === roomSlug);
            if (!room) return;

            // Format dates to Y-m-d format for API
            const checkInDate = new Date(booking.check_in_date).toISOString().split('T')[0];
            const checkOutDate = new Date(booking.check_in_date).toISOString().split('T')[0]; // Same date for Day Tour
            
            const response = await api.get(
                `${API_PREFIX}/admin/bookings/${booking.id}/available-room-units`,
                {
                    requiresAuth: true,
                    params: { 
                        room_id: room.id, 
                        check_in_date: checkInDate, 
                        check_out_date: checkOutDate
                    }
                }
            );
            
            const apiUnits = (response.data.available_units || []).filter(unit => 
                unit && unit.id && unit.unit_number
            );
            
            // Get the current room's assigned unit from the form data
            const currentFormRoom = form.getValues(`rooms.${roomIndex}`);
            const currentRoomUnitId = currentFormRoom?.room_unit_id;
            const currentRoomUnitNumber = currentFormRoom?.unit_number;
            
            // Get units assigned to OTHER rooms of the SAME TYPE in the current form
            const currentFormRooms = form.getValues('rooms');
            const currentRoomSlug = form.getValues(`rooms.${roomIndex}.room_id`);
            const sameTypeUnits = currentFormRooms
                .filter((room, index) => 
                    index !== roomIndex && 
                    room.room_id === currentRoomSlug && 
                    room.room_unit_id
                )
                .map(room => ({
                    id: room.room_unit_id,
                    unit_number: room.unit_number,
                    status: 'assigned_to_other',
                    notes: 'Assigned to another room'
                }));
            
            let finalUnits = [];
            
            // Start with API available units
            finalUnits = [...apiUnits];
            
            // Add units assigned to other rooms of the same type (if not already in API results)
            sameTypeUnits.forEach(sameTypeUnit => {
                const existsInApi = apiUnits.some(apiUnit => apiUnit.id === sameTypeUnit.id);
                if (!existsInApi) {
                    finalUnits.push(sameTypeUnit);
                }
            });
            
            // Add current room's unit if it exists and is not already in the list
            if (currentRoomUnitId && currentRoomUnitNumber) {
                const currentUnitExists = finalUnits.some(unit => unit.id === currentRoomUnitId);
                if (!currentUnitExists) {
                    const currentUnit = {
                        id: currentRoomUnitId,
                        unit_number: currentRoomUnitNumber,
                        status: 'occupied',
                        notes: 'Currently assigned'
                    };
                    finalUnits.unshift(currentUnit); // Add to beginning
                }
            }
            
            setRoomUnits(prev => ({
                ...prev,
                [roomSlug]: finalUnits
            }));
        } catch (error) {
            console.error('Failed to load room units:', error);
            toast.error('Failed to load available room units');
        } finally {
            setIsLoadingUnits(prev => ({ ...prev, [roomSlug]: false }));
        }
    };

    const addRoom = () => {
        append({
            room_id: '',
            room_unit_id: null,
            adults: 1,
            children: 0,
            include_lunch: false,
            include_pm_snack: false,
            room_name: '',
            unit_number: null
        });
    };

    const removeRoom = (index) => {
        remove(index);
        // Reload units for all remaining rooms after removal
        setTimeout(() => {
            reloadAllUnits();
        }, 100);
    };

    const reloadAllUnits = () => {
        const currentRooms = form.getValues('rooms');
        currentRooms.forEach((room, index) => {
            if (room.room_id) {
                loadAvailableUnits(room.room_id, index);
            }
        });
    };

    const handleRoomChange = (index, roomSlug) => {
        const room = availableRooms.find(r => r.slug === roomSlug);
        if (room) {
            form.setValue(`rooms.${index}.room_name`, room.name);
            form.setValue(`rooms.${index}.room_unit_id`, null);
            form.setValue(`rooms.${index}.unit_number`, null);
            
            // Clear validation errors when room changes
            form.clearErrors(`rooms.${index}.adults`);
            form.clearErrors(`rooms.${index}.children`);
            form.clearErrors(`rooms.${index}.room_unit_id`);
            
            loadAvailableUnits(roomSlug, index);
        }
    };

    const handleRoomUnitChange = (index, unitId) => {
        const roomSlug = form.getValues(`rooms.${index}.room_id`);
        const units = roomUnits[roomSlug] || [];
        const selectedUnit = units.find(unit => unit.id === unitId);
        
        if (selectedUnit) {
            form.setValue(`rooms.${index}.room_unit_id`, unitId);
            form.setValue(`rooms.${index}.unit_number`, selectedUnit.unit_number);
        }
    };

    const handleGuestCountChange = (index, field, value) => {
        form.setValue(`rooms.${index}.${field}`, parseInt(value));
        
        // Clear capacity error when guest count changes
        form.clearErrors(`rooms.${index}.adults`);
        form.clearErrors(`rooms.${index}.children`);
    };

    const calculateEstimatedTotal = () => {
        if (!currentPricing || !availability) return 0;

        const rooms = form.getValues('rooms');
        let total = 0;

        rooms.forEach(room => {
            if (room.room_id) {
                const totalGuests = room.adults + room.children;
                const basePrice = currentPricing.price_per_pax * totalGuests;
                
                let mealCost = 0;
                if (room.include_lunch && availability.lunch_prices) {
                    mealCost += (room.adults * availability.lunch_prices.adult) + 
                               (room.children * availability.lunch_prices.child);
                }
                if (room.include_pm_snack && availability.pm_snack_prices) {
                    mealCost += (room.adults * availability.pm_snack_prices.adult) + 
                               (room.children * availability.pm_snack_prices.child);
                }
                
                total += basePrice + mealCost;
            }
        });

        return total;
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
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
                    const totalGuests = room.adults + room.children;
                    const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                    
                    
                    return totalGuests > maxCapacity;
                }
                return false;
            });

            if (hasCapacityExceeded) {
                // Find which rooms exceed capacity and set form errors
                data.rooms.forEach((room, index) => {
                    const availableRoom = availableRooms.find(ar => ar.slug === room.room_id);
                    if (availableRoom) {
                        const totalGuests = room.adults + room.children;
                        const maxCapacity = availableRoom.max_guests + (availableRoom.extra_guests || 0);
                        if (totalGuests > maxCapacity) {
                            form.setError(`rooms.${index}.adults`, {
                                type: 'capacity_exceeded',
                                message: `Room '${availableRoom.name}' can accommodate maximum ${maxCapacity} guests (Max: ${availableRoom.max_guests}, Extra: ${availableRoom.extra_guests || 0}). You have ${totalGuests} guests.`
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

            // Validate minimum guest requirements
            const hasInvalidGuestCounts = data.rooms.some((room, index) => {
                const totalGuests = room.adults + room.children;
                return totalGuests < 1;
            });

            if (hasInvalidGuestCounts) {
                data.rooms.forEach((room, index) => {
                    const totalGuests = room.adults + room.children;
                    if (totalGuests < 1) {
                        form.setError(`rooms.${index}.adults`, {
                            type: 'min_guests',
                            message: 'At least 1 guest is required per room'
                        });
                    }
                });
                
                toast.error('Each room must have at least 1 guest');
                return;
            }

            // Validate modification reason is provided
            if (!data.modification_reason || data.modification_reason.trim() === '') {
                form.setError('modification_reason', {
                    type: 'required',
                    message: 'Modification reason is required'
                });
                toast.error('Please provide a reason for this modification');
                return;
            }

            const response = await api.patch(
                `${API_PREFIX}/admin/bookings/${booking.id}/modify-day-tour`,
                data,
                { requiresAuth: true }
            );

            toast.success('Day Tour booking modified successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to modify Day Tour booking:', error);
            toast.error(error.response?.data?.message || 'Failed to modify Day Tour booking');
        } finally {
            setIsLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Modify Day Tour Booking
                    </DialogTitle>
                    <DialogDescription>
                        Modify rooms, guest counts, and meal options for this Day Tour booking.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6">
                        {/* Pricing Summary - Compact */}
                        {currentPricing && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatCurrency(currentPricing.price_per_pax)}
                                            </div>
                                            <div className="text-xs text-gray-600">Per Guest</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatCurrency(calculateEstimatedTotal())}
                                            </div>
                                            <div className="text-xs text-gray-600">Total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-orange-600">
                                                {currentPricing.name}
                                            </div>
                                            <div className="text-xs text-gray-600">Tier</div>
                                        </div>
                                    </div>
                                    
                                    {/* Meal Options Summary */}
                                    {availability && (availability.lunch_prices || availability.pm_snack_prices) && (
                                        <div className="flex items-center gap-4 text-sm">
                                            {availability.lunch_prices && (
                                                <div className="flex items-center gap-1">
                                                    <UtensilsCrossed className="h-4 w-4 text-green-600" />
                                                    <span className="text-green-700">Lunch Available</span>
                                                </div>
                                            )}
                                            {availability.pm_snack_prices && (
                                                <div className="flex items-center gap-1">
                                                    <Coffee className="h-4 w-4 text-orange-600" />
                                                    <span className="text-orange-700">PM Snack Available</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rooms Section - Compact */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Rooms & Guests</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addRoom}
                                    className="cursor-pointer"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Room
                                </Button>
                            </div>

                            {fields.map((field, index) => {
                                const hasUnitError = form.formState.errors.rooms?.[index]?.room_unit_id;
                                const hasCapacityError = form.formState.errors.rooms?.[index]?.adults;
                                const hasError = hasUnitError || hasCapacityError;
                                
                                return (
                                <div key={field.id} className={`border rounded-lg p-4 bg-white border-l-4 ${hasError ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-gray-900">Room {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeRoom(index)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Room Selection Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                        <FormField
                                            control={form.control}
                                            name={`rooms.${index}.room_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Room Type</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleRoomChange(index, value);
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select room type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {availableRooms.map((room) => (
                                                                <SelectItem key={room.slug} value={room.slug}>
                                                                    <div className="flex justify-between items-center w-full">
                                                                        <span className="truncate">{room.name}</span>
                                                                        <span className="text-gray-500 ml-2 text-xs">
                                                                            Max: {room.max_guests + (room.extra_guests || 0)}
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

                                        <FormField
                                            control={form.control}
                                            name={`rooms.${index}.room_unit_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Room Unit</FormLabel>
                                                    <Select
                                                        value={field.value?.toString() || ''}
                                                        onValueChange={(value) => {
                                                            field.onChange(value ? parseInt(value) : null);
                                                            handleRoomUnitChange(index, value ? parseInt(value) : null);
                                                        }}
                                                        disabled={!form.watch(`rooms.${index}.room_id`) || isLoadingUnits[form.watch(`rooms.${index}.room_id`)]}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder={
                                                                    isLoadingUnits[form.watch(`rooms.${index}.room_id`)] 
                                                                        ? "Loading..." 
                                                                        : "Select unit"
                                                                } />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roomUnits[form.watch(`rooms.${index}.room_id`)]?.map((unit) => {
                                                                let displayText = `Unit ${unit.unit_number}`;
                                                                
                                                                // Show status based on unit properties
                                                                if (unit.status === 'occupied' || unit.notes === 'Currently assigned') {
                                                                    displayText += ' (Currently assigned)';
                                                                } else if (unit.status === 'assigned_to_other') {
                                                                    displayText += ' (Assigned to another room)';
                                                                }
                                                                
                                                                return (
                                                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                                                        {displayText}
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Guest Counts Row */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {(() => {
                                            const roomSlug = form.watch(`rooms.${index}.room_id`);
                                            const availableRoom = availableRooms.find(r => r.slug === roomSlug);
                                            const maxCapacity = availableRoom ? (availableRoom.max_guests + (availableRoom.extra_guests || 0)) : 10;
                                            
                                            
                                            return (
                                                <>
                                                    <div>
                                                        <FormLabel className="text-sm">Adults</FormLabel>
                                                        <GuestSelector
                                                            name={`rooms.${index}.adults`}
                                                            minGuests={1}
                                                            maxGuests={maxCapacity}
                                                            value={form.watch(`rooms.${index}.adults`)?.toString() || '1'}
                                                            onChange={(value) => handleGuestCountChange(index, 'adults', value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <FormLabel className="text-sm">Children</FormLabel>
                                                        <GuestSelector
                                                            name={`rooms.${index}.children`}
                                                            minGuests={0}
                                                            maxGuests={maxCapacity}
                                                            value={form.watch(`rooms.${index}.children`)?.toString() || '0'}
                                                            onChange={(value) => handleGuestCountChange(index, 'children', value)}
                                                        />
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Meal Options Row */}
                                    {availability && (availability.lunch_prices || availability.pm_snack_prices) && (
                                        <div className="space-y-2">
                                            <FormLabel className="text-sm">Meal Options</FormLabel>
                                            <div className="flex flex-wrap gap-4">
                                                {availability.lunch_prices && (
                                                    <FormField
                                                        control={form.control}
                                                        name={`rooms.${index}.include_lunch`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="h-4 w-4"
                                                                    />
                                                                </FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                                                        Buffet Lunch
                                                                    </FormLabel>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatCurrency(availability.lunch_prices.adult)}/{formatCurrency(availability.lunch_prices.child)}
                                                                    </span>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}

                                                {availability.pm_snack_prices && (
                                                    <FormField
                                                        control={form.control}
                                                        name={`rooms.${index}.include_pm_snack`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="h-4 w-4"
                                                                    />
                                                                </FormControl>
                                                                <div className="flex items-center gap-2">
                                                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                                                        PM Snack
                                                                    </FormLabel>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatCurrency(availability.pm_snack_prices.adult)}/{formatCurrency(availability.pm_snack_prices.child)}
                                                                    </span>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>

                        {/* Modification Reason */}
                        <FormField
                            control={form.control}
                            name="modification_reason"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                        Modification Reason 
                                        <span className="text-red-500 ml-1">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Please provide a reason for this modification..."
                                            className={`min-h-[80px] ${
                                                fieldState.error 
                                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                            }`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {!fieldState.error && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            This information will be recorded for audit purposes
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Email Notification */}
                        <FormField
                            control={form.control}
                            name="send_email"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div>
                                        <FormLabel className="text-sm">Send email notification to guest</FormLabel>
                                        <p className="text-xs text-gray-600">
                                            Notify the guest about this booking modification
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>

                <DialogFooter className="px-6 pb-6 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        onClick={form.handleSubmit(onSubmit)}
                        className="cursor-pointer"
                    >
                        {isLoading ? 'Modifying...' : 'Modify Day Tour Booking'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DayTourRoomModificationDialog;
