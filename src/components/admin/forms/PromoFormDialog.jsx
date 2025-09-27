// src/components/admin/forms/PromoFormDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import FormSelectField from '@/components/common/form/FormSelectField';
import { useForm } from 'react-hook-form';
import { usePromosApi } from '@/hooks/api/usePromosApi';
import { useImagesApi } from '@/hooks/api/useImagesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import Loader from "@/components/common/Loader";

const discountTypeOptions = [
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage (%)' },
];
const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const scopeOptions = [
    { value: 'room', label: 'Room' },
    { value: 'meal', label: 'Meal' },
    { value: 'total', label: 'Total' },
];

// Helper function to convert datetime from server (Asia/Singapore) to datetime-local format
const convertToLocalDatetime = (serverDatetime) => {
    if (!serverDatetime) return '';
    
    try {
        // Parse the server datetime (which is in Asia/Singapore timezone)
        const date = new Date(serverDatetime);
        
        // Convert to local timezone and format for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
        console.error('Error converting datetime:', error);
        return '';
    }
};

export default function PromoFormDialog({
    open, onOpenChange, onSuccess, initialData, isEdit, promoId, loading: parentLoading = false
}) {
    const api = usePromosApi();
    const imagesApi = useImagesApi();
    const [submitting, setSubmitting] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [imageLibrary, setImageLibrary] = useState([]);
    const [showLibrary, setShowLibrary] = useState(false);
    const [imageSearch, setImageSearch] = useState('');
    const debouncedImageSearch = useDebounce(imageSearch, 300);
    const [uploadingImage, setUploadingImage] = useState(false);

    const form = useForm({
        defaultValues: initialData || {
            code: '',
            title: '',
            description: '',
            starts_at: '',
            ends_at: '',
            scope: '',
            discount_type: 'fixed',
            discount_value: '',
            expires_at: '',
            max_uses: '',
            active: 'inactive', // default new promo as inactive; can be changed by user
            exclusive: false,
            excluded_days: [],
            per_night_calculation: false,
        },
    });
    const { reset } = form;
    // If editing, populate form with initialData
    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.code || '',
                title: initialData.title || '',
                description: initialData.description || '',
                starts_at: initialData.starts_at
                    ? convertToLocalDatetime(initialData.starts_at) // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
                    : '',
                ends_at: initialData.ends_at
                    ? convertToLocalDatetime(initialData.ends_at) // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
                    : '',
                scope: initialData.scope || '',
                discount_type: initialData.discount_type || 'fixed',
                discount_value:
                    initialData.discount_value != null
                        ? String(initialData.discount_value)
                        : '',
                expires_at: initialData.expires_at
                    ? initialData.expires_at.split(' ')[0]
                    : '',
                max_uses:
                    initialData.max_uses != null ? String(initialData.max_uses) : '',
                active: initialData.active || 'inactive',
                exclusive: !!initialData.exclusive,
                excluded_days: initialData.excluded_days || [],
                per_night_calculation: !!initialData.per_night_calculation,
            });
            setSelectedImageUrl(initialData.image_url || '');
        } else {
            reset({
                code: '',
                title: '',
                description: '',
                starts_at: '',
                ends_at: '',
                scope: '',
                discount_type: 'fixed',
                discount_value: '',
                expires_at: '',
                max_uses: '',
                active: 'inactive',
                exclusive: false,
                excluded_days: [],
                per_night_calculation: false,
            });
            setSelectedImageUrl('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    // Fetch image library when toggled or search changes (debounced)
    useEffect(() => {
        if (!showLibrary) return;
        const fetchImages = async () => {
            try {
                const res = await imagesApi.list({ search: debouncedImageSearch });
                setImageLibrary(res.data || []);
            } catch {
                toast.error('Failed to load images.');
            }
        };
        fetchImages();
    }, [showLibrary, debouncedImageSearch]);

    const handleImageSelect = (url) => {
        setSelectedImageUrl(url);
        setShowLibrary(false);
    };

    // Resize image file if too large (same as other modules)
    const resizeImageFile = (file) => {
        return new Promise(resolve => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                let { width, height } = img;
                const MAX_DIMENSION = 1920;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    if (blob) {
                        const ext = file.type.includes("png") ? "png" : "jpg";
                        const resizedFile = new File([blob], file.name, { type: `image/${ext}` });
                        resolve(resizedFile);
                    } else {
                        resolve(file);
                    }
                    URL.revokeObjectURL(url);
                }, file.type.includes("png") ? "image/png" : "image/jpeg", 0.8);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(file);
            };
            img.src = url;
        });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file.');
            return;
        }
        setUploadingImage(true);
        try {
            const formData = new FormData();
            // Resize image if needed (same as other modules)
            const fileToUpload = await resizeImageFile(file);
            // names[] is required by API even if only one file; use filename without extension
            const name = file.name.replace(/\.[^/.]+$/, '');
            formData.append('files[]', fileToUpload);
            formData.append('names[]', name);
            const res = await imagesApi.create(formData);
            const uploaded = Array.isArray(res.data)
                ? res.data[0]
                : res.data.data?.[0];
            if (uploaded && uploaded.secure_image_url) {
                setSelectedImageUrl(uploaded.secure_image_url);
                toast.success('Image uploaded successfully!');
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to upload image. Please try again.'
            );
        } finally {
            setUploadingImage(false);
            // reset file input
            event.target.value = '';
        }
    };

    const onSubmit = async (values) => {
        setSubmitting(true);
        
        
        const payload = {
            code: values.code,
            title: values.title,
            description: values.description || null,
            scope: values.scope,
            discount_type: values.discount_type,
            discount_value: parseFloat(values.discount_value),
            starts_at: values.starts_at || null,
            ends_at: values.ends_at || null,
            expires_at: values.expires_at || null,
            max_uses: values.max_uses === "" ? null : parseInt(values.max_uses),
            image_url: selectedImageUrl || null,
            exclusive: !!values.exclusive,
            active: values.active,
            // New fields for flexible promo logic - FIXED LOGIC
            excluded_days: values.excluded_days && values.excluded_days.length > 0 ? values.excluded_days : null,
            per_night_calculation: values.per_night_calculation === true,
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
            const msg = error.response?.data?.message || error.response?.data?.error || "Failed to save promo code.";
            toast.error(msg);
        } finally {

            setSubmitting(false);
        }
    };

    const showLoader = submitting || parentLoading; // we can also track local submitting state if needed
    const formTitle = isEdit ? "Edit Promo Code" : "Add Promo Code";
    const formDescription = isEdit
        ? "Update the promo code details below."
        : "Enter details for the new promo code.";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto p-0">
                <div className="relative p-6">
                    <DialogHeader>
                        <DialogTitle>{formTitle}</DialogTitle>
                        <DialogDescription>{formDescription}</DialogDescription>
                    </DialogHeader>
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
                            <FormField
                                name="title"
                                control={form.control}
                                rules={{ required: 'Title is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter title for display" />
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
                                            <Textarea
                                                {...field}
                                                rows={3}
                                                placeholder="Short description of the promo"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="starts_at"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date & Time</FormLabel>
                                        <FormControl>
                                                <DateTimePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    setDate={(date) => {
                                                        if (date) {
                                                            // Convert to datetime-local format for backend
                                                            const year = date.getFullYear();
                                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                                            const day = String(date.getDate()).padStart(2, '0');
                                                            const hours = String(date.getHours()).padStart(2, '0');
                                                            const minutes = String(date.getMinutes()).padStart(2, '0');
                                                            field.onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
                                                        } else {
                                                            field.onChange('');
                                                        }
                                                    }}
                                                    placeholder="Select start date and time"
                                                />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="ends_at"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date & Time</FormLabel>
                                        <FormControl>
                                            <DateTimePicker
                                                date={field.value ? new Date(field.value) : undefined}
                                                setDate={(date) => {
                                                    if (date) {
                                                        // Convert to datetime-local format for backend
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        const hours = String(date.getHours()).padStart(2, '0');
                                                        const minutes = String(date.getMinutes()).padStart(2, '0');
                                                        field.onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
                                                    } else {
                                                        field.onChange('');
                                                    }
                                                }}
                                                placeholder="Select end date and time"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormSelectField
                                name="scope"
                                control={form.control}
                                label="Scope"
                                options={scopeOptions}
                                required
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
                            <FormField
                                name="exclusive"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exclusive Offer?</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="per_night_calculation"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Per-Night Calculation?</FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-sm text-gray-600">
                                            Enable to apply discount per eligible night instead of entire booking
                                        </p>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="excluded_days"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Excluded Days of Week</FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 0, label: 'Sunday' },
                                                    { value: 1, label: 'Monday' },
                                                    { value: 2, label: 'Tuesday' },
                                                    { value: 3, label: 'Wednesday' },
                                                    { value: 4, label: 'Thursday' },
                                                    { value: 5, label: 'Friday' },
                                                    { value: 6, label: 'Saturday' },
                                                ].map((day) => (
                                                    <div key={day.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`excluded-day-${day.value}`}
                                                            checked={field.value?.includes(day.value) || false}
                                                            onCheckedChange={(checked) => {
                                                                const currentDays = field.value || [];
                                                                if (checked) {
                                                                    field.onChange([...currentDays, day.value]);
                                                                } else {
                                                                    field.onChange(currentDays.filter(d => d !== day.value));
                                                                }
                                                            }}
                                                        />
                                                        <label 
                                                            htmlFor={`excluded-day-${day.value}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {day.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-sm text-gray-600">
                                            Select days of the week to exclude from promo discount
                                        </p>
                                    </FormItem>
                                )}
                            />
                            {/* Image selection */}
                            <div className="space-y-2">
                                <FormLabel>Promo Image (optional)</FormLabel>
                                {selectedImageUrl && (
                                    <div className="w-full h-32 bg-cover bg-center rounded-lg border relative" style={{ backgroundImage: `url(${selectedImageUrl})` }}>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="absolute top-1 right-1"
                                            onClick={() => setSelectedImageUrl('')}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                                <div className="flex gap-2 items-center">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowLibrary((val) => !val)}>
                                        {showLibrary ? 'Hide' : 'Select from Library'}
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="promo-image-upload"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="hidden"
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={uploadingImage}
                                        onClick={() => document.getElementById('promo-image-upload')?.click()}
                                    >
                                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                    </Button>
                                </div>
                                {showLibrary && (
                                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
                                        <Input
                                            placeholder="Search images..."
                                            value={imageSearch}
                                            onChange={(e) => setImageSearch(e.target.value)}
                                            className="mb-2"
                                        />
                                        {imageLibrary.length === 0 && <p className="text-sm italic">No images found.</p>}
                                        {imageLibrary.map((img) => (
                                            <div
                                                key={img.id}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                                onClick={() => handleImageSelect(img.secure_image_url || img.image_url)}
                                            >
                                                <img
                                                    src={img.secure_image_url || img.image_url}
                                                    alt={img.name}
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                                <span className="text-sm">{img.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="cursor-pointer">
                                    {isEdit ? "Save Changes" : "Create Promo"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                    {showLoader && <Loader container="dialog" />}
                </div>
            </DialogContent>
        </Dialog >
    );
}
