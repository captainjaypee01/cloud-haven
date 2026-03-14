// components/admin/AddOtherChargeDialog.jsx
import React, { useEffect } from 'react';
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

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Amount is required'),
    remarks: z.string().min(1, 'Remarks/description is required'),
});

const AddOtherChargeDialog = ({ open, onOpenChange, bookingId, onSuccess, charge }) => {
    const isEdit = Boolean(charge);
    const api = useApi();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { amount: '', remarks: '' },
    });
    const { setError, reset } = form;

    useEffect(() => {
        if (!open) {
            reset();
            return;
        }
        if (charge) {
            reset({ amount: Number(charge.amount), remarks: charge.remarks || '' });
        } else {
            reset({ amount: '', remarks: '' });
        }
    }, [open, charge, reset]);

    const handleSubmit = async (values) => {
        try {
            if (isEdit) {
                await api.patch(
                    `${API_PREFIX}/admin/bookings/${bookingId}/other-charges/${charge.id}`,
                    values,
                    { requiresAuth: true }
                );
                toast.success('Other charge updated');
            } else {
                await api.post(`${API_PREFIX}/admin/bookings/${bookingId}/other-charges`, values, { requiresAuth: true });
                toast.success('Other charge added');
            }
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
                toast.error(isEdit ? 'Failed to update other charge' : 'Failed to add other charge');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Other Charge' : 'Add Other Charge'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <FormField name="amount" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl><Input type="number" min={0.01} step={0.01} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="remarks" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Remarks / Description</FormLabel>
                                <FormControl>
                                    <Textarea rows={3} placeholder="Describe the reason for this charge (e.g., late checkout, broken lamp)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? 'Saving...' : isEdit ? 'Update Charge' : 'Add Charge'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddOtherChargeDialog;
