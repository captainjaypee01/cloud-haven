import React, { useEffect, useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormSelectField from "@/components/common/form/FormSelectField";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { toast } from "sonner";
import Loader from "../../common/Loader";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    short_description: z.string().optional(),
    description: z.string().optional(),
    max_guests: z.coerce.number().min(1, "Required"),
    extra_guests: z.coerce.number().default(2),
    quantity: z.coerce.number().default(1),
    allows_day_use: z.coerce.boolean().default(0),
    base_weekday_rate: z.coerce.number().min(0),
    base_weekend_rate: z.coerce.number().min(0),
    price_per_night: z.coerce.number().min(0),
    is_featured: z.coerce.boolean().default(0),
    status: z.union([
        z.literal("available"),
        z.literal("unavailable"),
        z.literal("archived"),
    ]).default("available"),
});

const STATUS_OPTIONS = [
    { value: "available", label: "Available" },
    { value: "unavailable", label: "Unavailable" },
    { value: "archived", label: "Archived" }
];

const YES_NO_OPTIONS = [
    { value: 1, label: "Yes" },
    { value: 0, label: "No" }
];

const RoomFormDialog = ({
    open,
    onOpenChange,
    initialData,
    loading,
    isEdit,
    onSuccess,
    roomId,
    loading: parentLoading = false,
}) => {
    const api = useApi();
    const [submitting, setSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: '',
            short_description: '',
            description: '',
            max_guests: 1,
            extra_guests: 2,
            quantity: 1,
            allows_day_use: 0,
            base_weekday_rate: 0,
            base_weekend_rate: 0,
            price_per_night: 0,
            is_featured: 0,
            status: "available",
        }
    });
    const { setError } = form;

    useEffect(() => {
        if (open && initialData) {
            form.reset(initialData);
        } else if (open && !initialData) {
            form.reset(form.defaultValues);
        }
        // eslint-disable-next-line
    }, [open, initialData]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (isEdit && roomId) {
                await api.put(`${API_PREFIX}/admin/rooms/${roomId}`, values, { requiresAuth: true });
                toast.success("Room updated successfully!");
            } else {
                await api.post(`${API_PREFIX}/admin/rooms`, values, { requiresAuth: true });
                toast.success("Room created successfully!");
            }
            onSuccess && onSuccess();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error("Please fix the errors in the form.");
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const showLoader = parentLoading || submitting;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Room' : 'Add Room'}</DialogTitle>
                </DialogHeader>
                {showLoader && (
                    <div className="flex justify-center items-center py-8">
                        <Loader />
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField name="name" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="max_guests" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Max Guests</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="extra_guests" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Extra Guests</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="quantity" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="base_weekday_rate" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Base Weekday Rate</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="base_weekend_rate" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Base Weekend Rate</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="price_per_night" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Price per Night</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField name="short_description" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="description" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormSelectField
                                name="allows_day_use"
                                control={form.control}
                                label="Allows Day Use?"
                                options={YES_NO_OPTIONS}
                            />
                            <FormSelectField
                                name="is_featured"
                                control={form.control}
                                label="Featured?"
                                options={YES_NO_OPTIONS}
                            />
                            <FormSelectField
                                name="status"
                                control={form.control}
                                label="Status"
                                options={STATUS_OPTIONS}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="cursor-pointer">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || submitting} className="cursor-pointer">
                                {isEdit ? 'Update' : 'Add'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default RoomFormDialog;
