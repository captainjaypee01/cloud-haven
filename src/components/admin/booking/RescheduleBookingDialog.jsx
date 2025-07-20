import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/useApi';
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

const formSchema = z.object({
    check_in_date: z.string().min(1, 'Check-in date is required'),
    check_out_date: z.string().min(1, 'Check-out date is required'),
}).refine(
    (data) => !data.check_in_date || !data.check_out_date || data.check_in_date <= data.check_out_date,
    {
        message: 'Check-out date must be after or same as check-in date',
        path: ['check_out_date'],
    }
);

const RescheduleBookingDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            check_in_date: booking?.check_in_date || '',
            check_out_date: booking?.check_out_date || '',
        },
    });
    const { setError, reset, getValues, watch } = form;
    const [checking, setChecking] = useState(false);
    const [unavailable, setUnavailable] = useState([]);
    const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

    const originalNights = useMemo(() => {
        if (!booking?.check_in_date || !booking?.check_out_date) return 0;
        return differenceInDays(parseISO(booking.check_out_date), parseISO(booking.check_in_date));
    }, [booking]);

    const checkIn = watch('check_in_date');
    const checkOut = watch('check_out_date');

    const newNights = useMemo(() => {
        if (!checkIn || !checkOut) return 0;
        const inDate = parseISO(checkIn);
        const outDate = parseISO(checkOut);
        if (!isValid(inDate) || !isValid(outDate)) return 0;
        return differenceInDays(outDate, inDate);
    }, [checkIn, checkOut]);

    const durationError = (
        !!checkIn && !!checkOut && newNights !== originalNights
            ? `Selected dates must be exactly ${originalNights} night(s).`
            : null
    );
    useEffect(() => {
        if (open && booking) {
            reset({
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
            });
        }
    }, [open, booking, reset]);

    // Check room availability for new date
    const checkAvailability = async (check_in, check_out) => {
        setChecking(true);
        try {
            const res = await api.post(`${API_PREFIX}/rooms/availability`, {
                items: booking.booking_rooms.map(br => ({
                    room_id: br.room?.slug,
                    requested_count: 1,
                })),
                check_in,
                check_out,
            });
            const unavailableItems = res.data.filter(x => !x.available || x.available_count < x.requested_count);
            setUnavailable(unavailableItems);
            setAvailabilityModalOpen(unavailableItems.length > 0);
            return unavailableItems.length === 0;
        } catch (e) {
            toast.error('Error checking availability. Try again.');
            return false;
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (values) => {
        const ok = await checkAvailability(values.check_in_date, values.check_out_date);
        if (!ok) return;
        try {
            await api.patch(`${API_PREFIX}/admin/bookings/${booking.id}/reschedule`, values, { requiresAuth: true });
            toast.success('Booking rescheduled!');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error('Please fix the errors in the form.');
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to reschedule booking.');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reschedule Booking</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <FormField name="check_in_date" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Check-in Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                                {durationError && (
                                    <div className="text-sm text-red-600 mt-2">{durationError}</div>
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
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={form.formState.isSubmitting || checking}
                            >
                                {form.formState.isSubmitting || checking ? 'Saving...' : 'Reschedule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
                <AvailabilityModal
                    open={availabilityModalOpen}
                    items={unavailable}
                    onClose={() => setAvailabilityModalOpen(false)}
                    onRefresh={async () => {
                        const values = form.getValues();
                        await checkAvailability(values.check_in_date, values.check_out_date);
                    }}
                    checking={checking}
                    isActions={false}
                />
            </DialogContent>
        </Dialog>
    );
};

export default RescheduleBookingDialog;
