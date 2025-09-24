// src/components/admin/forms/ReviewFormDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import FormSelectField from '@/components/common/form/FormSelectField';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useReviewsApi } from '@/hooks/api/useReviewsApi';
import Loader from "@/components/common/Loader";

const typeOptions = [
    { value: "room", label: "Room" },
    { value: "resort", label: "Resort" },
];

const ratingOptions = [
    { value: 1, label: "1 Star" },
    { value: 2, label: "2 Stars" },
    { value: 3, label: "3 Stars" },
    { value: 4, label: "4 Stars" },
    { value: 5, label: "5 Stars" },
];

const ReviewFormDialog = ({ open, onOpenChange, onSuccess, initialData, isEdit, reviewId, loading }) => {
    const reviewsApi = useReviewsApi();
    const [submitting, setSubmitting] = useState(false);
    const defaultValues = {
        booking_id: null,
        user_id: null,
        room_id: null,
        first_name: "",
        last_name: "",
        type: "room",
        rating: 5,
        comment: "",
        is_testimonial: false,
    };
    const form = useForm({
        defaultValues,
        values: initialData ? {
            booking_id: initialData.booking_id || null,
            user_id: initialData.user_id || null,
            room_id: initialData.room_id || null,
            first_name: initialData.first_name || "",
            last_name: initialData.last_name || "",
            type: initialData.type || "room",
            rating: initialData.rating || 5,
            comment: initialData.comment || "",
            is_testimonial: initialData.is_testimonial || false,
        } : undefined
    });

    // Reset form when initialData changes or when dialog is opened/closed
    useEffect(() => {
        if (initialData) {
            form.reset({
                booking_id: initialData.booking_id || null,
                user_id: initialData.user_id || null,
                room_id: initialData.room_id || null,
                first_name: initialData.first_name || "",
                last_name: initialData.last_name || "",
                type: initialData.type || "room",
                rating: initialData.rating || 5,
                comment: initialData.comment || "",
                is_testimonial: initialData.is_testimonial || false,
            });
        } else {
            form.reset(defaultValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            // Clean up empty values
            const cleanedValues = {
                ...values,
                booking_id: values.booking_id || null,
                user_id: values.user_id || null,
                room_id: values.room_id || null,
                first_name: values.first_name || null,
                last_name: values.last_name || null,
            };

            if (isEdit && reviewId) {
                await reviewsApi.update(reviewId, cleanedValues);
                toast.success("Review updated successfully!");
            } else {
                await reviewsApi.create(cleanedValues);
                toast.success("Review created successfully!");
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Review form submit error:", error);
            toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to save review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const showLoader = loading || submitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Review" : "Add Review"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the review details below."
                            : "Fill in the details for the new review."}
                    </DialogDescription>
                </DialogHeader>

                {showLoader && (
                    <div className="flex justify-center items-center py-8">
                        <Loader />
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                name="first_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="First name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="last_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Last name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                name="booking_id"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Booking ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                type="number" 
                                                placeholder="Booking ID" 
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="room_id"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Room ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                type="number" 
                                                placeholder="Room ID" 
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormSelectField
                                name="type"
                                control={form.control}
                                label="Type"
                                options={typeOptions}
                                rules={{ required: "Type is required" }}
                            />
                            <FormSelectField
                                name="rating"
                                control={form.control}
                                label="Rating"
                                options={ratingOptions}
                                rules={{ required: "Rating is required" }}
                            />
                        </div>

                        <FormField
                            name="comment"
                            control={form.control}
                            rules={{ required: "Comment is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comment</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            {...field} 
                                            placeholder="Write your review comment here..." 
                                            rows={4}
                                            maxLength={1000}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="is_testimonial"
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
                                            Mark as Testimonial
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Check this if this review should be featured as a testimonial
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={loading}>
                                {isEdit ? "Save Changes" : "Create Review"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewFormDialog;
