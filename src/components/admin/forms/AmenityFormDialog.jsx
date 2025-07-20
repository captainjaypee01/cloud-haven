// components/admin/forms/AmenityFormDialog.jsx
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FormSelectField from "@/components/common/form/FormSelectField";
import { useForm } from "react-hook-form";
import { useAmenitiesApi } from '@/hooks/useAmenitiesApi';
import { toast } from 'sonner';
import Loader from "../../common/Loader";

const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

export default function AmenityFormDialog({
    open,
    onOpenChange,
    onSuccess,
    initialData,
    loading,
    isEdit,
    amenityId,
    loading: parentLoading = false,
}) {
    const api = useAmenitiesApi();
    const [submitting, setSubmitting] = useState(false);
    const form = useForm({
        defaultValues: initialData || {
            name: "",
            description: "",
            status: "active",
        },
        values: initialData
            ? {
                name: initialData.name || "",
                description: initialData.description || "",
                status: initialData.status || "active",
            }
            : undefined,
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                status: initialData.status || "active",
            });
        } else {
            form.reset({
                name: "",
                description: "",
                status: "active",
            });
        }
        // eslint-disable-next-line
    }, [initialData, open]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (isEdit && amenityId) {
                await api.update(amenityId, values);
                toast.success("Amenity updated successfully!");
            } else {
                await api.create(values);
                toast.success("Amenity created successfully!");
            }
            if (onSuccess) onSuccess();
        } catch (e) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const showLoader = parentLoading || submitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Amenity" : "Add Amenity"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update amenity details below." : "Enter the details for the new amenity."}
                    </DialogDescription>
                </DialogHeader>
                {showLoader && (
                    <div className="flex justify-center items-center py-8">
                        <Loader />
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <FormField
                            name="name"
                            control={form.control}
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} autoFocus className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="description"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormSelectField
                            name="status"
                            control={form.control}
                            label="Status"
                            options={statusOptions}
                            required
                        />
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="cursor-pointer"
                                disabled={loading}
                            >
                                {isEdit ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
