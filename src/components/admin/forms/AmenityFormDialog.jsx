// components/admin/forms/AmenityFormDialog.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FormSelectField from "@/components/common/form/FormSelectField";
import { useForm } from "react-hook-form";
import { useAmenitiesApi } from '@/hooks/useAmenitiesApi';
import { toast } from 'sonner';
import Loader from "../../common/Loader";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

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
    lucideIcons = {},
    ICON_OPTIONS = [],
}) {
    const api = useAmenitiesApi();
    const [submitting, setSubmitting] = useState(false);
    const [iconSearch, setIconSearch] = useState("");
    const debouncedIconSearch = useDebounce(iconSearch, 250);
    console.log('iconSearch', iconSearch);
    console.log('initialData', initialData);
    const form = useForm({
        defaultValues: initialData || {
            name: "",
            description: "",
            status: "active",
            icon: "BedDouble", // default icon
        },
        values: initialData
            ? {
                name: initialData.name || "",
                description: initialData.description || "",
                status: initialData.status || "active",
                icon: initialData.icon || "BedDouble",
            }
            : undefined,
    });

    // UseMemo for filtered icons
    const filteredIcons = useMemo(() => {
        let filtered = ICON_OPTIONS;
        if (debouncedIconSearch) {
            filtered = ICON_OPTIONS.filter(icon =>
                icon.toLowerCase().includes(debouncedIconSearch.toLowerCase())
            );
        } else {
            filtered = ICON_OPTIONS.slice(0, 30); // only show first 30 when blank
        }
        return filtered;
    }, [debouncedIconSearch, ICON_OPTIONS]);

    useEffect(() => {
        const fallbackIcon = "BedDouble";
        if (initialData) {
            const iconValue = initialData.icon || fallbackIcon;
            // Only set search if the icon exists, else clear search (or set to fallback icon)
            if (initialData.icon) {
                setIconSearch(iconValue);
            } else {
                setIconSearch("");
            }
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                status: initialData.status || "active",
                icon: iconValue, // Always provide a value!
            });
        } else {
            setIconSearch("");
            form.reset({
                name: "",
                description: "",
                status: "active",
                icon: fallbackIcon,
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
            // If validation fails or API error, show error message from response or generic
            console.log(e)
            const msg = e.response?.data?.message || e.response?.data?.error || "Something went wrong. Please try again.";
            toast.error(msg);
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
                        {/* Lucide Icon grid picker */}
                        <FormField
                            name="icon"
                            control={form.control}
                            rules={{ required: "Icon is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <Input
                                        placeholder="Search icon..."
                                        value={iconSearch}
                                        onChange={e => setIconSearch(e.target.value)}
                                        className="mb-2"
                                    />
                                    <TooltipProvider>
                                        <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto border rounded-md p-2 bg-muted/20">
                                            {filteredIcons.length === 0 && (
                                                <div className="col-span-6 text-center text-xs text-muted-foreground">
                                                    No icons found.
                                                </div>
                                            )}
                                            {filteredIcons.map(icon => {
                                                const LucideIcon = lucideIcons[icon];
                                                return (
                                                    <Tooltip key={icon}>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    "border rounded flex items-center justify-center p-2 transition",
                                                                    field.value === icon
                                                                        ? "border-primary bg-primary/10 text-primary"
                                                                        : "hover:border-muted-foreground"
                                                                )}
                                                                onClick={() => field.onChange(icon)}
                                                                aria-label={icon}
                                                            >
                                                                <LucideIcon className="h-5 w-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <span className="capitalize">{icon}</span>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </TooltipProvider>

                                    <FormMessage />
                                </FormItem>
                            )}
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
