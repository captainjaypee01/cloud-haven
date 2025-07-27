// src/components/admin/forms/MealPriceFormDialog.jsx
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useMealsApi } from '@/hooks/api/useMealsApi';
import { toast } from 'sonner';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
    category: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0, "Price is Required"),
    min_age: z.coerce.number().optional(),
    max_age: z.coerce.number().optional(),
});

export default function MealPriceFormDialog({
    open, onOpenChange, onSuccess, initialData, isEdit, mealPriceId, loading: parentLoading = false
}) {
    const api = useMealsApi();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            category: "",
            price: "0",
            min_age: "",
            max_age: "",
        }
    });

    // If editing, populate form with initialData
    useEffect(() => {
        if (initialData) {
            form.reset({
                category: initialData.category || "",
                price: initialData.price || "0",
                min_age: initialData.min_age || "",
                max_age: initialData.max_age || "",
            });
        } else {
            form.reset({
                category: "",
                price: "0",
                min_age: "",
                max_age: "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    const onSubmit = async (values) => {
        const payload = {
            ...values,
        };
        console.log('payload', payload)
        try {
            if (isEdit && mealPriceId) {
                await api.update(mealPriceId, payload);
                toast.success("Meal Price code updated successfully!");
            } else {
                await api.create(payload);
                toast.success("Meal Price code created successfully!");
            }
            onSuccess && onSuccess();
        } catch (error) {
            // If validation fails or API error, show error message from response or generic
            const msg = error.response?.data?.message || "Failed to save meal price.";
            toast.error(msg);
        }
    };

    const submitting = parentLoading; // we can also track local submitting state if needed
    const formTitle = isEdit ? "Edit Meal Price" : "Add Meal Price";
    const formDescription = isEdit
        ? "Update the meal price details below."
        : "Enter details for the new meal price.";

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
                            name="category"
                            control={form.control}
                            rules={{ required: "Category is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} autoFocus placeholder="e.g. Adult Buffet" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField name="price" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage /></FormItem>
                        )} />
                        <FormField
                            name="min_age"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Min age</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" min="0" placeholder="No restriction if blank" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="max_age"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max age</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" min="0" placeholder="No restriction if blank" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={submitting} className="cursor-pointer">
                                {isEdit ? "Save Changes" : "Create Meal Price"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
