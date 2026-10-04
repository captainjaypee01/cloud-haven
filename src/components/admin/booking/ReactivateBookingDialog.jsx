// components/admin/booking/ReactivateBookingDialog.jsx
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2, RotateCcw } from 'lucide-react';

const HOLD_OPTIONS = [
    { value: '2', label: '2 hours' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '24 hours' },
    { value: '48', label: '48 hours' },
    { value: '72', label: '72 hours' },
];

const formSchema = z.object({
    hold_hours: z.string().min(1, 'Hold duration is required'),
    notify_guest: z.boolean(),
});

const ReactivateBookingDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const isExpired = booking?.status === 'cancelled';

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hold_hours: '2',
            notify_guest: false,
        },
    });

    const { reset } = form;

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const handleSubmit = async (values) => {
        if (!booking?.id) return;

        try {
            const response = await api.post(`${API_PREFIX}/admin/bookings/${booking.id}/reactivate`, {
                hold_hours: Number(values.hold_hours),
                notify_guest: values.notify_guest,
            }, { requiresAuth: true });

            toast.success(response.data?.message || 'Booking reactivated');
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reactivate booking');
        }
    };

    if (!booking) return null;

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        {isExpired ? 'Reactivate Expired Booking' : 'Extend Booking Hold'}
                    </DialogTitle>
                    <DialogDescription>
                        {isExpired
                            ? 'Restore this booking to pending with a new hold, keeping all guest and room details.'
                            : 'Give the guest more time to pay before the booking expires.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border p-3 bg-muted/50 space-y-1 text-sm">
                        <p className="break-all"><span className="font-medium">Reference:</span> {booking.reference_number}</p>
                        <p className="break-words"><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                        <p>
                            <span className="font-medium">Dates:</span> {formatDate(booking.check_in_date)}
                            {booking.booking_type !== 'day_tour' && <> &ndash; {formatDate(booking.check_out_date)}</>}
                        </p>
                        <p>
                            <span className="font-medium">{isExpired ? 'Expired' : 'Reserved Until'}:</span>{' '}
                            {booking.local_reserved_until ? formatDateTime(booking.local_reserved_until) : '-'}
                        </p>
                    </div>

                    {isExpired && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Room availability will be re-checked. If the original room unit was taken, another unit of the same room type will be assigned.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                name="hold_hours"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New hold duration (from now)</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select hold duration" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {HOLD_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="notify_guest"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Email the guest a new reservation notice</FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                Leave unchecked for walk-in guests who are at the front desk
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>

                <DialogFooter>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                        <Button
                            type="submit"
                            className="cursor-pointer w-full sm:w-auto"
                            disabled={isSubmitting}
                            onClick={form.handleSubmit(handleSubmit)}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isExpired ? 'Reactivate Booking' : 'Extend Hold'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReactivateBookingDialog;
