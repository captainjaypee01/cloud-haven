// components/admin/booking/BookingCancellationDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/useApi';
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
import { Checkbox } from '@/components/ui/checkbox';
import FormSelectField from '@/components/common/form/FormSelectField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
    reason: z.string().min(1, 'Cancellation reason is required'),
    reference_confirmation: z.string().min(1, 'Reference number confirmation is required'),
    confirm_cancellation: z.boolean().refine(val => val === true, {
        message: 'You must confirm the cancellation',
    }),
});

const BookingCancellationDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const [cancellationReasons, setCancellationReasons] = useState([]);
    const [loadingReasons, setLoadingReasons] = useState(false);
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: '',
            reference_confirmation: '',
            confirm_cancellation: false,
        },
    });
    
    const { setError, reset } = form;

    // Fetch cancellation reasons when dialog opens
    useEffect(() => {
        if (open && cancellationReasons.length === 0) {
            fetchCancellationReasons();
        }
    }, [open, cancellationReasons]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const fetchCancellationReasons = async () => {
        setLoadingReasons(true);
        try {
            const response = await api.get(`${API_PREFIX}/admin/bookings/cancellation-reasons`, { requiresAuth: true });
            const reasons = response.data?.reasons || {};
            
            // Convert reasons object to select options
            const reasonOptions = Object.entries(reasons).map(([key, value]) => ({
                value: key,
                label: value,
            }));
            
            setCancellationReasons(reasonOptions);
        } catch (error) {
            console.error('Failed to fetch cancellation reasons:', error);
            toast.error('Failed to load cancellation reasons');
        } finally {
            setLoadingReasons(false);
        }
    };

    const handleSubmit = async (values) => {
        if (!booking?.id) {
            toast.error('No booking selected');
            return;
        }

        // Validate reference number confirmation
        if (values.reference_confirmation !== booking.reference_number) {
            setError('reference_confirmation', { 
                type: 'manual', 
                message: 'Reference number does not match. Please enter the exact reference number to confirm cancellation.' 
            });
            toast.error('Reference number confirmation failed');
            return;
        }

        try {
            // Get the actual reason text from the selected option
            const selectedReason = cancellationReasons.find(r => r.value === values.reason);
            const reasonText = selectedReason ? selectedReason.label : values.reason;

            await api.post(`${API_PREFIX}/admin/bookings/${booking.id}/cancel`, {
                reason: reasonText,
                confirm_cancellation: values.confirm_cancellation,
            }, { requiresAuth: true });
            
            toast.success('Booking cancelled successfully');
            if (onSuccess) onSuccess();
            onOpenChange(false);
            reset();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error("Please fix the errors in the form.");
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to cancel booking');
            }
        }
    };

    // Check if booking can be cancelled
    const canCancel = booking && ['pending', 'failed'].includes(booking.status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancel Booking
                    </DialogTitle>
                </DialogHeader>

                {/* Warning Alert */}
                <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        This action cannot be undone. The booking will be permanently cancelled and an email notification will be sent to the guest.
                        <br />
                        <em className="text-xs text-destructive/80 mt-1 block">Note: This feature is available to Admin and Superadmin users only.</em>
                    </AlertDescription>
                </Alert>

                {/* Booking Info */}
                {booking && (
                    <div className="rounded-lg border p-3 bg-muted/50">
                        <h4 className="font-medium mb-2">Booking Details</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Reference:</span> {booking.reference_number}</p>
                            <p><span className="font-medium">Guest:</span> {booking.guest_name}</p>
                            <p><span className="font-medium">Status:</span> 
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    booking.status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {booking.status}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {canCancel ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                            <FormSelectField
                                name="reason"
                                control={form.control}
                                label="Cancellation Reason"
                                options={cancellationReasons}
                                loading={loadingReasons}
                                placeholder="Select a reason for cancellation"
                            />

                            {/* Reference Number Confirmation */}
                            <FormField
                                name="reference_confirmation"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-destructive">
                                            Confirm Cancellation by Typing Reference Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={`Type "${booking?.reference_number}" to confirm`}
                                                {...field}
                                                className="border-destructive/50 focus:border-destructive"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Enter the booking reference number <strong>{booking?.reference_number}</strong> to confirm cancellation
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="confirm_cancellation"
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
                                            <FormLabel className="text-destructive">
                                                I confirm this cancellation
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                This action is permanent and will notify the guest via email
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={form.formState.isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="cursor-pointer"
                                    disabled={
                                        form.formState.isSubmitting || 
                                        !form.watch('confirm_cancellation') ||
                                        form.watch('reference_confirmation') !== booking?.reference_number
                                    }
                                >
                                    {form.formState.isSubmitting ? 'Cancelling...' : 'Cancel Booking'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                This booking cannot be cancelled. Only bookings with 'pending' or 'failed' status can be cancelled.
                            </AlertDescription>
                        </Alert>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default BookingCancellationDialog;
