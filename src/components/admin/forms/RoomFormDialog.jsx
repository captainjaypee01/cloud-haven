import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormSelectField from "@/components/common/form/FormSelectField";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { toast } from "sonner";
import Loader from "../../common/Loader";
import { useImagesApi } from "@/hooks/api/useImagesApi";
import { useDebounce } from "@/hooks/useDebounce";
import { assets } from "@/assets/assets";
import { Checkbox } from "@/components/ui/checkbox";
import { useAmenitiesApi } from "@/hooks/useAmenitiesApi"

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
    status: z.union([z.literal("available"), z.literal("unavailable"), z.literal("archived")]).default("available"),
    amenity_ids: z.array(z.number()).optional(),
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

const MAX_DIMENSION = 1920;

const RoomFormDialog = ({ open, onOpenChange, initialData, loading, isEdit, onSuccess, roomId, loading: parentLoading = false }) => {
    const api = useApi();
    const amenitiesApi = useAmenitiesApi();
    const imagesApi = useImagesApi();
    const [submitting, setSubmitting] = useState(false);
    const [amenities, setAmenities] = useState([]);
    const [fetchingAmenities, setFetchingAmenities] = useState(false);
    const [amenitiesSearch, setAmenitiesSearch] = useState("");
    const debouncedAmenitiesSearch = useDebounce(amenitiesSearch, 350);
    // Fetch amenities (with search)
    useEffect(() => {
        if (!open) return;
        setFetchingAmenities(true);
        amenitiesApi
            .list({ search: debouncedAmenitiesSearch })
            .then((res) => {
                setAmenities(Array.isArray(res.data) ? res.data : (res.data.data || []));
            })
            .catch(() => {
                setAmenities([]);
                toast.error("Failed to load amenities.");
            })
            .finally(() => setFetchingAmenities(false));
    }, [open, debouncedAmenitiesSearch]);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            name: "",
            short_description: "",
            description: "",
            max_guests: 1,
            extra_guests: 2,
            quantity: 1,
            allows_day_use: 0,
            base_weekday_rate: 0,
            base_weekend_rate: 0,
            price_per_night: 0,
            is_featured: 0,
            status: "available",
            amenity_ids: [],
        },
    });
    const { setError } = form;

    // State for image selection
    const [selectedImages, setSelectedImages] = useState([]);
    const [libraryImages, setLibraryImages] = useState([]);
    const [libSearch, setLibSearch] = useState("");
    const debouncedLibSearch = useDebounce(libSearch, 300);
    const [showLibrary, setShowLibrary] = useState(false);
    const fileInputRef = useRef(null);
    const [dragIndex, setDragIndex] = useState(null);

    // Reset form fields and initialize selected images when dialog opens
    useEffect(() => {
        if (open && initialData) {
            form.reset({
                ...initialData,
                amenity_ids: (initialData.amenities || []).map((a) => a.id),
            });
            if (initialData.images) {
                const initialSelected = initialData.images.map(img => ({
                    type: "existing",
                    id: img.id,
                    url: img.secure_image_url,
                    name: img.name,
                }));
                setSelectedImages(initialSelected);
            }
        } else if (open && !initialData) {
            form.reset({
                name: "",
                short_description: "",
                description: "",
                max_guests: 1,
                extra_guests: 2,
                quantity: 1,
                allows_day_use: 0,
                base_weekday_rate: 0,
                base_weekend_rate: 0,
                price_per_night: 0,
                is_featured: 0,
                status: "available",
                amenity_ids: [],
            });
            setSelectedImages([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialData]);

    // Fetch image library when the panel is open or search term changes
    useEffect(() => {
        if (!showLibrary) return;
        const fetchLibraryImages = async () => {
            try {
                const res = await imagesApi.list({ search: debouncedLibSearch });
                setLibraryImages(res.data || []);
            } catch {
                toast.error("Failed to load images.");
            }
        };
        fetchLibraryImages();
    }, [showLibrary, debouncedLibSearch]);

    // Resize image file if too large (similar to ManageImages)
    const resizeImageFile = (file) => {
        return new Promise(resolve => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                let { width, height } = img;
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

    // Handle adding new image files (upload via file input or drag-drop)
    const handleAddFiles = (fileList) => {
        const filesArray = Array.from(fileList);
        const imageFiles = filesArray.filter(file => file.type.startsWith("image/"));
        if (imageFiles.length + selectedImages.filter(i => i.type === "new").length > 20) {
            toast.error("You can only add up to 20 images.");
            return;
        }
        if (imageFiles.length < filesArray.length) {
            toast.error("Some files were skipped because they are not images.");
        }
        const newItems = imageFiles.map(file => ({
            type: "new",
            file: file,
            preview: URL.createObjectURL(file),
            name: file.name.replace(/\.[^/.]+$/, ""),
        }));
        setSelectedImages(prev => [...prev, ...newItems]);
    };

    // Drag-and-drop reordering handlers for selected images
    const handleDragOverSelected = (e) => e.preventDefault();
    const handleDropSelected = (targetIndex) => {
        if (dragIndex === null) return;
        const newList = [...selectedImages];
        let insertIndex = targetIndex;
        if (dragIndex < targetIndex) insertIndex--;  // adjust index if moving forward
        const [moved] = newList.splice(dragIndex, 1);
        newList.splice(insertIndex, 0, moved);
        setSelectedImages(newList);
        setDragIndex(null);
    };

    // Remove an image from selected list
    const removeSelectedImage = (index) => {
        setSelectedImages(prev => {
            const item = prev[index];
            if (item && item.type === "new") {
                URL.revokeObjectURL(item.preview);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    // Add an image from the library to selected list
    const handleAddExistingImage = (image) => {
        if (selectedImages.some(item => item.type === "existing" && item.id === image.id)) {
            toast.warning("Image already added.");
            return;
        }
        setSelectedImages(prev => [...prev, {
            type: "existing",
            id: image.id,
            url: image.secure_image_url,
            name: image.name,
        }]);
    };

    // Form submission: create or update room, including uploading new images and sending image IDs
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            // Prepare payload and upload any new images first
            const payload = { ...values };
            payload.amenity_ids = values.amenity_ids || [];
            if (selectedImages.length) {
                const newItems = selectedImages.filter(i => i.type === "new");
                const existingIds = selectedImages.filter(i => i.type === "existing").map(i => i.id);
                let uploadedIds = [];
                if (newItems.length) {
                    const formData = new FormData();
                    for (const item of newItems) {
                        const fileToUpload = await resizeImageFile(item.file);
                        formData.append("files[]", fileToUpload);
                        formData.append("names[]", item.name || "image");
                    }
                    const res = await imagesApi.create(formData);
                    uploadedIds = res.data.map(img => img.id);
                }
                payload.image_ids = [...existingIds, ...uploadedIds];
            }
            if (isEdit && roomId) {
                await api.put(`${API_PREFIX}/admin/rooms/${roomId}`, payload, { requiresAuth: true });
                toast.success("Room updated successfully!");
            } else {
                await api.post(`${API_PREFIX}/admin/rooms`, payload, { requiresAuth: true });
                toast.success("Room created successfully!");
            }
            onSuccess && onSuccess();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                // Map validation errors to form fields
                for (const [field, messages] of Object.entries(err.response.data.errors)) {
                    setError(field, { type: "manual", message: messages.join(", ") });
                }
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

            <DialogContent className="max-w-xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto p-0">
                <div className="relative p-6">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Edit Room" : "Add Room"}</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 mt-4">
                            {/* Images selection section */}
                            <div className="mb-3">
                                <FormLabel>Images</FormLabel>
                                {selectedImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedImages.map((item, index) => (
                                            <div
                                                key={index}
                                                className="relative w-20 h-20 border rounded overflow-hidden group"
                                                draggable
                                                onDragStart={() => setDragIndex(index)}
                                                onDragOver={handleDragOverSelected}
                                                onDrop={() => handleDropSelected(index)}
                                                onDragEnd={() => setDragIndex(null)}
                                            >
                                                <img
                                                    src={item.type === "existing" ? item.url : item.preview}
                                                    alt={item.name || "Image"}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 truncate">
                                                    {item.name || "Image"}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removeSelectedImage(index)}
                                                    className="absolute top-0 right-0 m-1 hidden group-hover:flex w-5 h-5"
                                                >
                                                    <img src={assets.closeIcon} alt="Remove" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Upload Images
                                    </Button>
                                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowLibrary(!showLibrary)}>
                                        {showLibrary ? "Hide Library" : "Add from Existing"}
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => { if (e.target.files) handleAddFiles(e.target.files); e.target.value = null; }}
                                />
                                {showLibrary && (
                                    <div className="border rounded p-3 mt-2 max-h-64 overflow-y-auto">
                                        <div className="flex items-center mb-2">
                                            <Input
                                                placeholder="Search images..."
                                                value={libSearch}
                                                onChange={(e) => setLibSearch(e.target.value)}
                                                className="mr-2 flex-1"
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={() => setShowLibrary(false)}>
                                                Done
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {libraryImages.map(img => (
                                                <div
                                                    key={img.id}
                                                    className="relative cursor-pointer"
                                                    onClick={() => handleAddExistingImage(img)}
                                                >
                                                    <img
                                                        src={img.secure_image_url}
                                                        alt={img.name}
                                                        className="w-full h-20 object-cover rounded"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 truncate">
                                                        {img.name}
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition group-hover:flex hidden">
                                                        <span className="text-white text-xs">Add</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {libraryImages.length === 0 && (
                                                <p className="text-sm text-muted-foreground">No images found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Room information fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField name="name" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="max_guests" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Guests</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="extra_guests" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Extra Guests</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="quantity" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="base_weekday_rate" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Weekday Rate</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="base_weekend_rate" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Weekend Rate</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="price_per_night" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price per Night</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField name="short_description" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Description</FormLabel>
                                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="description" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormSelectField name="allows_day_use" control={form.control} label="Allows Day Use?" options={YES_NO_OPTIONS} />
                                <FormSelectField name="is_featured" control={form.control} label="Featured?" options={YES_NO_OPTIONS} />
                                <FormSelectField name="status" control={form.control} label="Status" options={STATUS_OPTIONS} />
                            </div>
                            {/* Amenities Search and Selection */}
                            <FormItem>
                                <FormLabel>Amenities</FormLabel>
                                <Input
                                    value={amenitiesSearch}
                                    onChange={e => setAmenitiesSearch(e.target.value)}
                                    placeholder="Search amenities..."
                                    className="mb-2 w-full"
                                />
                                <FormField
                                    name="amenity_ids"
                                    control={form.control}
                                    render={({ field }) => (
                                        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto border rounded-md p-2 bg-muted/20">
                                            {fetchingAmenities && (
                                                <span className="text-xs text-muted-foreground">Loading amenities...</span>
                                            )}
                                            {!fetchingAmenities && amenities.length === 0 && (
                                                <span className="text-xs text-muted-foreground">No amenities found.</span>
                                            )}
                                            {!fetchingAmenities && amenities.map((amenity) => (
                                                <label
                                                    key={amenity.id}
                                                    className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted/30 transition text-sm"
                                                >
                                                    <Checkbox
                                                        checked={field.value?.includes(amenity.id) || false}
                                                        onCheckedChange={checked => {
                                                            let updated = Array.isArray(field.value) ? [...field.value] : [];
                                                            if (checked) {
                                                                updated.push(amenity.id);
                                                            } else {
                                                                updated = updated.filter(id => id !== amenity.id);
                                                            }
                                                            field.onChange(updated);
                                                        }}
                                                        className="cursor-pointer"
                                                        id={`amenity-${amenity.id}`}
                                                    />
                                                    {/* Lucide Icon (if provided) */}
                                                    {amenity.icon && (
                                                        <span className="text-muted-foreground">
                                                            <i className={`lucide lucide-${amenity.icon.toLowerCase()}`}></i>
                                                        </span>
                                                    )}
                                                    <span>{amenity.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                                <FormMessage />
                            </FormItem>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || submitting}>
                                    {isEdit ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>

                    {showLoader && <Loader container="dialog" />}
                </div>
            </DialogContent>

        </Dialog >
    );
};

export default RoomFormDialog;
