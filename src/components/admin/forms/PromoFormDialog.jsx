// src/components/admin/forms/PromoFormDialog.jsx
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormSelectField from '@/components/common/form/FormSelectField';
import { useForm } from 'react-hook-form';
import { usePromosApi } from '@/hooks/api/usePromosApi';
import { toast } from 'sonner';

const discountTypeOptions = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage (%)' },
];
const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export default function PromoFormDialog({
    open, onOpenChange, onSuccess, initialData, isEdit, promoId, loading: parentLoading = false
}) {
    const api = usePromosApi();
    const form = useForm({
        defaultValues: initialData || {
            code: "",
            discount_type: "fixed",
            discount_value: "",
            expires_at: "",
            max_uses: "",
            active: "inactive",  // default new promo as inactive; can be changed by user
        }
    });

    // If editing, populate form with initialData
    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code || "",
                discount_type: initialData.discount_type || "fixed",
                discount_value: initialData.discount_value != null ? String(initialData.discount_value) : "",
                expires_at: initialData.expires_at ? initialData.expires_at.split(' ')[0] : "", // assume format "YYYY-MM-DD ..."
                max_uses: initialData.max_uses != null ? String(initialData.max_uses) : "",
                active: initialData.active || "inactive",
            });
        } else {
            form.reset({
                code: "",
                discount_type: "fixed",
                discount_value: "",
                expires_at: "",
                max_uses: "",
                active: "inactive",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    const onSubmit = async (values) => {
        console.log('values', values)
        const payload = {
            ...values,
            discount_value: parseFloat(values.discount_value),  // ensure numeric
            max_uses: values.max_uses === "" ? null : parseInt(values.max_uses),
        };
        try {
            if (isEdit && promoId) {
                await api.update(promoId, payload);
                toast.success("Promo code updated successfully!");
            } else {
                await api.create(payload);
                toast.success("Promo code created successfully!");
            }
            onSuccess && onSuccess();
        } catch (error) {
            // If validation fails or API error, show error message from response or generic
            const msg = error.response?.data?.message || "Failed to save promo code.";
            toast.error(msg);
        }
    };

    const submitting = parentLoading; // we can also track local submitting state if needed
    const formTitle = isEdit ? "Edit Promo Code" : "Add Promo Code";
    const formDescription = isEdit
        ? "Update the promo code details below."
        : "Enter details for the new promo code.";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formTitle}</DialogTitle>
                    <DialogDescription>{formDescription}</DialogDescription>
                </DialogHeader>
                {submitting && <div className="py-4">Saving...</div>}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        <FormField
                            name="code"
                            control={form.control}
                            rules={{ required: "Code is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Promo Code</FormLabel>
                                    <FormControl>
                                        <Input {...field} autoFocus placeholder="e.g. NEWYEAR2025" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormSelectField
                            name="discount_type"
                            control={form.control}
                            label="Discount Type"
                            options={discountTypeOptions}
                            required
                        />
                        <FormField
                            name="discount_value"
                            control={form.control}
                            rules={{ required: "Discount value is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount Value {form.watch("discount_type") === "percentage" ? "(%)" : "(Amount)"} </FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" step="0.01" min="0" placeholder="Enter discount value" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="expires_at"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expires At</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="max_uses"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Uses</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" min="1" placeholder="Unlimited if blank" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormSelectField
                            name="active"
                            control={form.control}
                            label="Status"
                            options={statusOptions}
                            required
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={submitting} className="cursor-pointer">
                                {isEdit ? "Save Changes" : "Create Promo"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
