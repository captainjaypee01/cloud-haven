// components/admin/AddPaymentDialog.jsx
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
import { Checkbox } from '@/components/ui/checkbox';
import FormSelectField from '@/components/common/form/FormSelectField';

const paymentProviders = [
    { value: 'netania', label: 'Netania' },
    { value: 'cash', label: 'Cash (On-site)' },
    { value: 'gcash', label: 'GCash' },
    { value: 'bank_bdo', label: 'Bank Transfer (BDO)' },
];

const paymentStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
];

const formSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Amount is required'),
    provider: z.string().min(1, 'Provider is required'),
    status: z.string().min(1, 'Status is required'),
    transaction_id: z.string().optional(),
    remarks: z.string().optional(),
    notify_guest: z.boolean().default(true),
});

const AddPaymentDialog = ({ open, onOpenChange, bookingReferenceNumber, onSuccess, payment, isEdit }) => {
    const api = useApi();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            provider: 'cash',
            status: 'paid',
            transaction_id: '',
            remarks: '',
            notify_guest: true,
        },
        values: payment ? {
            amount: payment.amount || '',
            provider: payment.provider || 'cash',
            status: payment.status || 'paid',
            transaction_id: payment.transaction_id || '',
            remarks: payment.remarks || '',
            notify_guest: true,
        } : undefined,
    });
    const { setError, reset } = form;

    useEffect(() => {
        if (!open) reset(payment ? {
            amount: payment.amount || '',
            provider: payment.provider || 'cash',
            status: payment.status || 'paid',
            transaction_id: payment.transaction_id || '',
            remarks: payment.remarks || '',
            notify_guest: true,
        } : undefined);
        // eslint-disable-next-line
    }, [open, payment]);

    const handleSubmit = async (values) => {
        try {
            if (isEdit && payment?.id) {
                await api.put(`${API_PREFIX}/admin/payments/${payment.id}`, values, { requiresAuth: true });
                toast.success('Payment updated');
            } else {
                await api.post(`${API_PREFIX}/admin/payments/pay`, {
                    reference_number: bookingReferenceNumber,
                    ...values,
                }, { requiresAuth: true });
                toast.success('Payment added');
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
                toast.error(isEdit ? 'Update Failed' : 'Payment Failed');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Payment' : 'Add Manual Payment'}</DialogTitle>
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
                        <FormField name="transaction_id" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction/Reference No</FormLabel>
                                <FormControl><Input type="text" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="remarks" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Remarks</FormLabel>
                                <FormControl><Input type="text" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormSelectField
                            name="provider"
                            control={form.control}
                            label="Provider"
                            options={paymentProviders}
                        />
                        <FormSelectField
                            name="status"
                            control={form.control}
                            label="Status"
                            options={paymentStatusOptions}
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
                                        <FormLabel>
                                            Notify guest via email
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            Send confirmation/problem notification email when status changes
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (isEdit ? 'Saving...' : 'Saving...') : (isEdit ? 'Update Payment' : 'Add Payment')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;
