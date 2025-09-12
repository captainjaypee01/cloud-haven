// components/admin/booking/BookingDeletionDialog.jsx
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
import { Trash2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
    reason: z.string().min(1, 'Deletion reason is required'),
    reference_confirmation: z.string().min(1, 'Reference number confirmation is required'),
    confirm_deletion: z.boolean().refine(val => val === true, {
        message: 'You must confirm the deletion',
    }),
});

const BookingDeletionDialog = ({ open, onOpenChange, booking, onSuccess }) => {
    const api = useApi();
    const [deletionReasons, setDeletionReasons] = useState([]);
    const [loadingReasons, setLoadingReasons] = useState(false);
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: '',
            reference_confirmation: '',
            confirm_deletion: false,
        },
    });
    
    const { setError, reset } = form;

    // Fetch deletion reasons when dialog opens (reuse cancellation reasons)
    useEffect(() => {
        if (open && deletionReasons.length === 0) {
            fetchDeletionReasons();
        }
    }, [open, deletionReasons]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const fetchDeletionReasons = async () => {
        setLoadingReasons(true);
        try {
            const response = await api.get(`${API_PREFIX}/admin/bookings/cancellation-reasons`, { requiresAuth: true });
            const reasons = response.data?.reasons || {};
            
            // Convert reasons object to select options
            const reasonOptions = Object.entries(reasons).map(([key, value]) => ({
                value: key,
                label: value,
            }));
            
            setDeletionReasons(reasonOptions);
        } catch (error) {
            console.error('Failed to fetch deletion reasons:', error);
            toast.error('Failed to load deletion reasons');
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
                message: 'Reference number does not match. Please enter the exact reference number to confirm deletion.' 
            });
            toast.error('Reference number confirmation failed');
            return;
        }

        try {
            // Get the actual reason text from the selected option
            const selectedReason = deletionReasons.find(r => r.value === values.reason);
            const reasonText = selectedReason ? selectedReason.label : values.reason;

            await api.post(`${API_PREFIX}/admin/bookings/${booking.id}/delete`, {
                reason: reasonText,
                confirm_deletion: values.confirm_deletion,
            }, { requiresAuth: true });
            
            toast.success('Booking deleted successfully');
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
                toast.error('Failed to delete booking');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Booking
                    </DialogTitle>
                </DialogHeader>

                {/* Warning Alert */}
                <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>This action is permanent and cannot be undone!</strong> The booking will be soft deleted from the system, status will be set to cancelled, and the guest will be notified via email.
                        <br />
                        <em className="text-xs text-destructive/80 mt-1 block">Note: This feature is only available to Superadmin users.</em>
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
                                    booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'downpayment' ? 'bg-blue-100 text-blue-800' :
                                    booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {booking.status}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <FormSelectField
                            name="reason"
                            control={form.control}
                            label="Deletion Reason"
                            options={deletionReasons}
                            loading={loadingReasons}
                            placeholder="Select a reason for deletion"
                        />

                        {/* Reference Number Confirmation */}
                        <FormField
                            name="reference_confirmation"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-destructive">
                                        Confirm Deletion by Typing Reference Number
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={`Type "${booking?.reference_number}" to confirm`}
                                            {...field}
                                            className="border-destructive/50 focus:border-destructive"
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Enter the booking reference number <strong>{booking?.reference_number}</strong> to confirm deletion
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="confirm_deletion"
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
                                            I understand this action is permanent and cannot be undone
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            The booking will be soft deleted, status changed to cancelled, and the guest will be notified
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
                                    !form.watch('confirm_deletion') ||
                                    form.watch('reference_confirmation') !== booking?.reference_number
                                }
                            >
                                {form.formState.isSubmitting ? 'Deleting...' : 'Delete Booking'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BookingDeletionDialog;
