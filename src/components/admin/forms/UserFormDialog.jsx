// src/components/admin/forms/UserFormDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import FormSelectField from '@/components/common/form/FormSelectField';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useUsersApi } from '@/hooks/api/useUsersApi';
import Loader from "@/components/common/Loader";

const roleOptions = [
    { value: "user", label: "User" },
    { value: "staff", label: "Staff" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Superadmin" }, // include if implementing superadmin logic
];

const UserFormDialog = ({ open, onOpenChange, onSuccess, initialData, isEdit, userId, loading }) => {
    const usersApi = useUsersApi();
    const [submitting, setSubmitting] = useState(false);
    const defaultValues = {
        first_name: "",
        last_name: "",
        email: "",
        role: "user",
        // If you want to include phone:
        // country_code: "",
        // contact_number: "",
    };
    const form = useForm({
        defaultValues,
        values: initialData ? {
            first_name: initialData.first_name || "",
            last_name: initialData.last_name || "",
            email: initialData.email || "",
            role: initialData.role || "user",
            // country_code: initialData.country_code || "",
            // contact_number: initialData.contact_number || "",
        } : undefined
    });

    // Reset form when initialData changes or when dialog is opened/closed
    useEffect(() => {
        if (initialData) {
            form.reset({
                first_name: initialData.first_name || "",
                last_name: initialData.last_name || "",
                email: initialData.email || "",
                role: initialData.role || "user",
                // country_code: initialData.country_code || "",
                // contact_number: initialData.contact_number || "",
            });
        } else {
            form.reset(defaultValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            if (isEdit && userId) {
                await usersApi.update(userId, values);
                toast.success("User updated successfully!");
            } else {
                await usersApi.create(values);
                toast.success("User created successfully!");
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("User form submit error:", error);
            // The API might return validation errors or a failure message
            toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to save user. Please try again.");
        } finally {

            setSubmitting(false);
        }
    };

    const showLoader = loading || submitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the user's details below."
                            : "Fill in the details for the new user account."}
                    </DialogDescription>
                </DialogHeader>

                {showLoader && (
                    <div className="flex justify-center items-center py-8">
                        <Loader />
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
                        <FormField
                            name="first_name"
                            control={form.control}
                            rules={{ required: "First name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
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
                            rules={{ required: "Last name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Last name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="email"
                            control={form.control}
                            rules={{
                                required: "Email is required",
                                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email address" }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="user@example.com" type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormSelectField
                            name="role"
                            control={form.control}
                            label="Role"
                            options={roleOptions}
                            rules={{ required: "Role is required" }}
                        />
                        {/* If including phone fields:
            <div className="flex gap-2">
              <FormField
                name="country_code"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="contact_number"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-2/3">
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            */}
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={loading}>
                                {isEdit ? "Save Changes" : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default UserFormDialog;
