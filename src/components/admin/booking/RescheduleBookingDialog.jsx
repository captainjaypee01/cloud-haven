import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/useApi';
import { useBookingChangePreview } from '@/hooks/useBookingChangePreview';
import BookingChangeBalancePreview from '@/components/admin/booking/BookingChangeBalancePreview';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import AvailabilityModal from '@/components/common/AvailabilityModal';
import { differenceInDays, parseISO, isValid } from 'date-fns';

// Dynamic schema based on booking type
const createFormSchema = (isDayTour, maxRescheduleDate) => {
    if (isDayTour) {
        return z.object({
            tour_date: z.string()
                .min(1, 'Tour date is required')
                .refine(
                    (date) => {
                        if (!date) return false;
                        const selectedDate = new Date(date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate >= today;
                    },
                    { message: 'Tour date must be today or later' }
                )
                .refine(
                    (date) => {
                        if (!date || !maxRescheduleDate) return true;
                        const selectedDate = new Date(date);
                        const maxDate = new Date(maxRescheduleDate);
                        return selectedDate <= maxDate;
                    },
                    { message: `Tour date must be within 30 days of original date (max: ${maxRescheduleDate})` }
                ),
        });
    } else {
        return z.object({
            check_in_date: z.string()
                .min(1, 'Check-in date is required')
                .refine(
                    (date) => {
                        if (!date) return false;
                        const selectedDate = new Date(date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate >= today;
                    },
                    { message: 'Check-in date must be today or later' }
                )
                .refine(
                    (date) => {
                        if (!date || !maxRescheduleDate) return true;
                        const selectedDate = new Date(date);
                        const maxDate = new Date(maxRescheduleDate);
                        return selectedDate <= maxDate;
                    },
                    { message: `Check-in date must be within 30 days of original date (max: ${maxRescheduleDate})` }
                ),
            check_out_date: z.string().min(1, 'Check-out date is required'),
        }).refine(
            (data) => !data.check_in_date || !data.check_out_date || data.check_in_date <= data.check_out_date,
            {
                message: 'Check-out date must be after or same as check-in date',
                path: ['check_out_date'],
            }
        );
    }
};

const RescheduleBookingDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const isDayTour = booking?.booking_type === 'day_tour';
    
    // Calculate max reschedule date (30 days from original check-in)
    const maxRescheduleDate = useMemo(() => {
        if (!booking?.check_in_date) return null;
        const originalDate = new Date(booking.check_in_date);
        const maxDate = new Date(originalDate);
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }, [booking?.check_in_date]);
    
    const form = useForm({
        resolver: zodResolver(createFormSchema(isDayTour, maxRescheduleDate)),
        defaultValues: isDayTour ? {
            tour_date: booking?.check_in_date || '',
        } : {
            check_in_date: booking?.check_in_date || '',
            check_out_date: booking?.check_out_date || '',
        },
    });
    const { setError, reset, watch } = form;
    const [checking, setChecking] = useState(false);
    const [unavailable, setUnavailable] = useState([]);
    const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

    const originalNights = useMemo(() => {
        if (!booking?.check_in_date || !booking?.check_out_date) return 0;
        return differenceInDays(parseISO(booking.check_out_date), parseISO(booking.check_in_date));
    }, [booking]);

    const checkIn = isDayTour ? watch('tour_date') : watch('check_in_date');
    const checkOut = isDayTour ? watch('tour_date') : watch('check_out_date');

    const newNights = useMemo(() => {
        if (isDayTour) return 0; // Day tours are always 0 nights
        if (!checkIn || !checkOut) return 0;
        const inDate = parseISO(checkIn);
        const outDate = parseISO(checkOut);
        if (!isValid(inDate) || !isValid(outDate)) return 0;
        return differenceInDays(outDate, inDate);
    }, [checkIn, checkOut, isDayTour]);

    const durationError = (
        !isDayTour && !!checkIn && !!checkOut && newNights !== originalNights
            ? `Selected dates must be exactly ${originalNights} night(s).`
            : null
    );

    // Check if dates have changed
    const datesChanged = useMemo(() => {
        if (isDayTour) {
            return checkIn !== booking?.check_in_date;
        } else {
            return checkIn !== booking?.check_in_date || checkOut !== booking?.check_out_date;
        }
    }, [checkIn, checkOut, booking?.check_in_date, booking?.check_out_date, isDayTour]);

    // Check if dates are within 30-day limit
    const withinLimit = useMemo(() => {
        if (!maxRescheduleDate || !checkIn) return true;
        const selectedDate = new Date(checkIn);
        const maxDate = new Date(maxRescheduleDate);
        return selectedDate <= maxDate;
    }, [checkIn, maxRescheduleDate]);

    // Get form errors count as a stable value
    const formErrorsCount = useMemo(() => {
        return Object.keys(form.formState.errors).length;
    }, [form.formState.errors]);

    // Check if there are any validation errors
    const hasValidationErrors = useMemo(() => {
        // Check form validation errors
        const formErrors = formErrorsCount > 0;
        
        // Check duration error for overnight bookings
        const durationErrorExists = !isDayTour && durationError;
        
        return formErrors || durationErrorExists || !withinLimit;
    }, [formErrorsCount, durationError, isDayTour, withinLimit]);

    // Check if submit should be disabled
    const isSubmitDisabled = useMemo(() => {
        return !datesChanged || hasValidationErrors || form.formState.isSubmitting || checking;
    }, [datesChanged, hasValidationErrors, form.formState.isSubmitting, checking]);

    const previewParams = useMemo(() => {
        if (!datesChanged || !checkIn || !checkOut || hasValidationErrors) return null;
        return {
            check_in_date: checkIn,
            check_out_date: checkOut,
        };
    }, [datesChanged, checkIn, checkOut, hasValidationErrors]);

    const { preview, loading: previewLoading } = useBookingChangePreview(
        booking?.id,
        'reschedule',
        previewParams,
        open && !!previewParams
    );

    useEffect(() => {
        if (open && booking) {
            if (isDayTour) {
                reset({
                    tour_date: booking.check_in_date,
                });
            } else {
                reset({
                    check_in_date: booking.check_in_date,
                    check_out_date: booking.check_out_date,
                });
            }
        }
    }, [open, booking, reset, isDayTour]);

    // Check room availability for new date
    const checkAvailability = async (check_in, check_out) => {
        setChecking(true);
        try {
            let res;
            
            if (isDayTour) {
                // For Day Tours, use the Day Tour availability endpoint
                const dayTourDate = check_in; // For Day Tours, check_in and check_out are the same
                const roomCounts = {};
                booking.booking_rooms.forEach(br => {
                    const roomId = br.room?.slug;
                    if (roomId) {
                        roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
                    }
                });

                const itemsToCheck = Object.entries(roomCounts).map(([roomId, count]) => ({
                    room_id: roomId,
                    requested_count: count
                }));

                res = await api.post(`${API_PREFIX}/day-tours/availability`, {
                    date: dayTourDate,
                    items: itemsToCheck
                });
            } else {
                // For overnight bookings, use the regular room availability endpoint
                res = await api.post(`${API_PREFIX}/rooms/availability`, {
                    items: booking.booking_rooms.map(br => ({
                        room_id: br.room?.slug,
                        requested_count: 1,
                    })),
                    check_in,
                    check_out,
                });
            }
            
            const unavailableItems = res.data.filter(x => !x.available || x.available_count < x.requested_count);
            setUnavailable(unavailableItems);
            setAvailabilityModalOpen(unavailableItems.length > 0);
            return unavailableItems.length === 0;
        } catch {
            toast.error('Error checking availability. Try again.');
            return false;
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (values) => {
        let checkInDate, checkOutDate;
        
        if (isDayTour) {
            checkInDate = values.tour_date;
            checkOutDate = values.tour_date;
        } else {
            checkInDate = values.check_in_date;
            checkOutDate = values.check_out_date;
        }
        
        const ok = await checkAvailability(checkInDate, checkOutDate);
        if (!ok) return;
        
        try {
            await api.patch(`${API_PREFIX}/admin/bookings/${booking.id}/reschedule`, values, { requiresAuth: true });
            toast.success(`${isDayTour ? 'Day Tour' : 'Booking'} rescheduled successfully!`);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error('Please fix the errors in the form.');
            } else if (err.response?.data) {
                toast.error(err.response.data.message || err.response.data.error || 'Failed to reschedule');
            } else {
                toast.error(`Failed to reschedule ${isDayTour ? 'day tour' : 'booking'}.`);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reschedule {isDayTour ? 'Day Tour' : 'Booking'}</DialogTitle>
                    <DialogDescription className="text-left">
                        Totals and meal pricing are recalculated for the new dates (room rates, meal program / buffet vs breakfast nights for overnight stays, and day-tour meal lines).
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        {isDayTour ? (
                            // Day Tour - Single date field
                            <FormField name="tour_date" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tour Date</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="date" 
                                            {...field} 
                                            max={maxRescheduleDate}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {maxRescheduleDate && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            Maximum reschedule date: {maxRescheduleDate} (30 days from original date)
                                        </div>
                                    )}
                                    {checkIn && maxRescheduleDate && new Date(checkIn) > new Date(maxRescheduleDate) && (
                                        <div className="text-xs text-red-600 mt-1">
                                            Selected date exceeds 30-day reschedule limit
                                        </div>
                                    )}
                                </FormItem>
                            )} />
                        ) : (
                            // Overnight - Check-in and Check-out dates
                            <>
                                <FormField name="check_in_date" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Check-in Date</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="date" 
                                                {...field} 
                                                max={maxRescheduleDate}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        {durationError && (
                                            <div className="text-sm text-red-600 mt-2">{durationError}</div>
                                        )}
                                        {maxRescheduleDate && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                Maximum reschedule date: {maxRescheduleDate} (30 days from original date)
                                            </div>
                                        )}
                                        {checkIn && maxRescheduleDate && new Date(checkIn) > new Date(maxRescheduleDate) && (
                                            <div className="text-xs text-red-600 mt-1">
                                                Selected date exceeds 30-day reschedule limit
                                            </div>
                                        )}
                                    </FormItem>
                                )} />
                                <FormField name="check_out_date" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Check-out Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="text-xs text-gray-500 italic">
                                    Original booking duration: {originalNights} night(s)
                                </div>
                                {!isDayTour && checkIn && checkOut && (
                                    <div className="text-xs text-gray-500 italic">
                                        New booking duration: {newNights} night(s)
                                        {newNights !== originalNights && (
                                            <span className="text-red-600 ml-1">(Duration mismatch!)</span>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Validation Summary */}
                        {datesChanged && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">Reschedule Summary:</div>
                                <div className="text-xs space-y-1">
                                    <div className={`flex items-center gap-2 ${datesChanged ? 'text-green-600' : 'text-gray-500'}`}>
                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                        Dates changed: {datesChanged ? 'Yes' : 'No'}
                                    </div>
                                    <div className={`flex items-center gap-2 ${!hasValidationErrors ? 'text-green-600' : 'text-red-600'}`}>
                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                        Validation: {hasValidationErrors ? 'Errors found' : 'Valid'}
                                    </div>
                                    {maxRescheduleDate && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            Within 30-day limit: {checkIn && new Date(checkIn) <= new Date(maxRescheduleDate) ? 'Yes' : 'No'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <BookingChangeBalancePreview
                            preview={preview}
                            loading={previewLoading}
                        />

                        <DialogFooter>
                            <div className="flex flex-col gap-2 w-full">
                                {/* Show helpful message when button is disabled */}
                                {isSubmitDisabled && !form.formState.isSubmitting && !checking && (
                                    <div className="text-sm text-gray-600">
                                        {!datesChanged && "Please change the dates to reschedule"}
                                        {datesChanged && hasValidationErrors && "Please fix the validation errors above"}
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    className="cursor-pointer"
                                    disabled={isSubmitDisabled}
                                >
                                    {form.formState.isSubmitting || checking ? 'Saving...' : 'Reschedule'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
                <AvailabilityModal
                    open={availabilityModalOpen}
                    items={unavailable}
                    onClose={() => setAvailabilityModalOpen(false)}
                    onRefresh={async () => {
                        const values = form.getValues();
                        if (isDayTour) {
                            await checkAvailability(values.tour_date, values.tour_date);
                        } else {
                            await checkAvailability(values.check_in_date, values.check_out_date);
                        }
                    }}
                    checking={checking}
                    isActions={false}
                />
            </DialogContent>
        </Dialog>
    );
};

export default RescheduleBookingDialog;
