import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/useApi';
import { useBookingChangePreview } from '@/hooks/useBookingChangePreview';
import BookingChangeBalancePreview from '@/components/admin/booking/BookingChangeBalancePreview';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { addDays, differenceInDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDate } from "@/lib/format";

/**
 * API sends calendar dates as YYYY-MM-DD. parseISO() treats that as UTC midnight, which shifts
 * the local calendar day in many timezones and breaks night counts. Parse as local date instead.
 */
function parseDateOnlyLocal(value) {
    if (value == null || value === '') return null;
    const s = String(value).slice(0, 10);
    const parts = s.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
}

const buildSchema = (checkInDate) =>
    z.object({
        new_check_out_date: z.string().min(1, 'New check-out date is required'),
        modification_reason: z.string().max(1000).optional().or(z.literal('')),
    }).refine(
        (data) => {
            if (!data.new_check_out_date || !checkInDate) return false;
            const out = parseDateOnlyLocal(data.new_check_out_date);
            const inn = parseDateOnlyLocal(checkInDate);
            if (!out || !inn) return false;
            return out > inn;
        },
        { message: 'Check-out must be after check-in', path: ['new_check_out_date'] }
    );

const AdjustBookingNightsDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const [submitting, setSubmitting] = useState(false);
    const [acknowledgeShortfall, setAcknowledgeShortfall] = useState(false);

    const checkIn = booking?.check_in_date;
    /**
     * Overnight: check-out must be after check-in. Native `min` = day after check-in so
     * the check-in day and all earlier dates are disabled.
     */
    const minCheckOutDate = useMemo(() => {
        const d = parseDateOnlyLocal(checkIn);
        if (!d) return '';
        return format(addDays(d, 1), 'yyyy-MM-dd');
    }, [checkIn]);

    const form = useForm({
        resolver: zodResolver(buildSchema(checkIn)),
        defaultValues: {
            new_check_out_date: booking?.check_out_date || '',
            modification_reason: '',
        },
    });

    useEffect(() => {
        if (open && booking) {
            form.reset({
                new_check_out_date: booking.check_out_date || '',
                modification_reason: '',
            });
            setAcknowledgeShortfall(false);
        }
    }, [open, booking, form]);

    const watchedOut = form.watch('new_check_out_date');
    const datesChanged = watchedOut && booking?.check_out_date && watchedOut !== booking.check_out_date;

    const previewParams = useMemo(() => {
        if (!datesChanged || !watchedOut) return null;
        return { new_check_out_date: watchedOut };
    }, [datesChanged, watchedOut]);

    const { preview, loading: previewLoading } = useBookingChangePreview(
        booking?.id,
        'adjust_nights',
        previewParams,
        open && !!datesChanged
    );

    const requiresAcknowledgement = preview?.downpayment_shortfall === true;

    const originalNights = useMemo(() => {
        if (!booking?.check_in_date || !booking?.check_out_date) return 0;
        const out = parseDateOnlyLocal(booking.check_out_date);
        const inn = parseDateOnlyLocal(booking.check_in_date);
        if (!out || !inn) return 0;
        return differenceInDays(out, inn);
    }, [booking]);

    const newNights = useMemo(() => {
        if (!checkIn || !watchedOut) return 0;
        const out = parseDateOnlyLocal(watchedOut);
        const inn = parseDateOnlyLocal(checkIn);
        if (!out || !inn) return 0;
        return differenceInDays(out, inn);
    }, [checkIn, watchedOut]);

    const handleSubmit = async (values) => {
        if (requiresAcknowledgement && !acknowledgeShortfall) {
            toast.error('Please acknowledge the downpayment shortfall before saving.');
            return;
        }

        setSubmitting(true);
        try {
            await api.patch(
                `${API_PREFIX}/admin/bookings/${booking.id}/adjust-nights`,
                {
                    new_check_out_date: values.new_check_out_date,
                    ...(values.modification_reason?.trim()
                        ? { modification_reason: values.modification_reason.trim() }
                        : {}),
                    ...(acknowledgeShortfall ? { acknowledge_downpayment_shortfall: true } : {}),
                },
                { requiresAuth: true }
            );
            toast.success('Stay length updated successfully');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.response?.data?.downpayment_shortfall) {
                toast.error(err.response.data.error || 'Downpayment shortfall must be acknowledged.');
            } else {
                const msg =
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    'Failed to adjust stay length';
                toast.error(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!booking || booking.booking_type === 'day_tour') {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} key={booking?.id ?? 'adjust-nights'}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adjust stay length</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-1 rounded-md border p-3 bg-muted/50">
                            <div>
                                <span className="font-medium text-foreground">Check-in: </span>
                                {formatDate(checkIn)}
                            </div>
                            <div>
                                <span className="font-medium text-foreground">Total nights (current booking): </span>
                                {originalNights}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="new_check_out_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New check-out date</FormLabel>
                                    <p className="text-xs text-muted-foreground -mt-1 mb-1">
                                        Check-in and earlier dates are not available. The first possible check-out is the day after check-in. Total nights = calendar days from check-in to check-out (e.g. Apr 2 in → Apr 4 out = 2 nights), same as the rest of the system.
                                    </p>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            min={minCheckOutDate || undefined}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {newNights >= 1 && (
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">Total nights for selected stay: </span>
                                            {newNights}
                                            {originalNights !== newNights && (
                                                <span className="block mt-1">
                                                    This booking is currently {originalNights} night
                                                    {originalNights !== 1 ? 's' : ''} total.
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="modification_reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Reason for changing the number of nights..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <BookingChangeBalancePreview
                            preview={preview}
                            loading={previewLoading}
                            acknowledgeChecked={acknowledgeShortfall}
                            onAcknowledgeChange={setAcknowledgeShortfall}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !datesChanged || (requiresAcknowledgement && !acknowledgeShortfall)}
                            >
                                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AdjustBookingNightsDialog;
