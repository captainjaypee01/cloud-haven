// components/admin/forms/DayTourPricingFormDialog.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    description: z.string().optional(),
    price_per_pax: z.coerce.number().min(0, 'Price must be positive'),
    effective_from: z.string().min(1, 'Effective from date is required'),
    effective_until: z.string().optional(),
    is_active: z.boolean().default(true),
}).refine((data) => {
    if (data.effective_until && data.effective_from) {
        return new Date(data.effective_until) > new Date(data.effective_from);
    }
    return true;
}, {
    message: "Effective until date must be after effective from date",
    path: ["effective_until"],
});

const DayTourPricingFormDialog = ({ 
    open, 
    onOpenChange, 
    onSave, 
    editingPricing = null,
    loading = false 
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            price_per_pax: 0,
            effective_from: '',
            effective_until: '',
            is_active: true,
        },
    });

    // Reset form when dialog opens/closes or editingPricing changes
    useEffect(() => {
        if (open) {
            if (editingPricing) {
                form.reset({
                    name: editingPricing.name || '',
                    description: editingPricing.description || '',
                    price_per_pax: editingPricing.price_per_pax || 0,
                    effective_from: editingPricing.effective_from || '',
                    effective_until: editingPricing.effective_until || '',
                    is_active: editingPricing.is_active ?? true,
                });
            } else {
                form.reset({
                    name: '',
                    description: '',
                    price_per_pax: 0,
                    effective_from: '',
                    effective_until: '',
                    is_active: true,
                });
            }
        }
    }, [open, editingPricing, form]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving Day Tour Pricing:', error);
            toast.error('Failed to save Day Tour Pricing');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingPricing ? 'Edit Day Tour Pricing' : 'Add New Day Tour Pricing'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="e.g., September 2024 Pricing" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="e.g., Includes entrance fee, parking, pool access, beach access, WiFi, and plated lunch"
                                            rows={3}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price_per_pax"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price per Pax (₱) *</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="800.00" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="effective_from"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Effective From *</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="date"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="effective_until"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Effective Until</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="date"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Active Status
                                        </FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Enable or disable this pricing
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="cursor-pointer"
                            >
                                {isSubmitting ? 'Saving...' : (editingPricing ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default DayTourPricingFormDialog;
