import React, { useRef, useState, useEffect } from "react";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useImagesApi } from "@/hooks/api/useImagesApi";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { assets } from "@/assets/assets";
import { useDebounce } from "@/hooks/useDebounce";
import DeleteDialog from '@/components/common/form/DeleteDialog';
import Loader from "@/components/common/Loader";

const MAX_BATCH = 20;
const MAX_DIMENSION = 1920;

const ManageImages = () => {
    const imagesApi = useImagesApi();
    const fileInputRef = useRef(null);

    // State for listing existing images and search term
    const [imagesList, setImagesList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDeleteImageId, setConfirmDeleteImageId] = useState(null);
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Form state for new image uploads (names)
    const form = useForm({ defaultValues: { images: [] } });
    const { fields, append, remove } = useFieldArray({ name: "images", control: form.control });
    const [files, setFiles] = useState([]);  // store File objects for new images
    const [previewUrls, setPreviewUrls] = useState([]);  // store preview URLs for new images
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch existing images whenever search term changes (debounced)
    useEffect(() => {
        const fetchImages = async () => {
            setIsSubmitting(true);
            try {
                const res = await imagesApi.list({ search: debouncedSearch });
                setImagesList(res.data || []);
            } catch {
                toast.error("Failed to load images.");
            } finally {

                setIsSubmitting(false);
            }
        };
        fetchImages();
    }, [debouncedSearch]);

    // Handle selecting new image files (via file input or drag-drop)
    const handleAddFiles = (fileList) => {
        const newFiles = Array.from(fileList);
        const imageFiles = newFiles.filter(file => file.type.startsWith("image/"));
        if (imageFiles.length + files.length > MAX_BATCH) {
            toast.error(`You can only upload up to ${MAX_BATCH} images at a time.`);
            return;
        }
        if (imageFiles.length < newFiles.length) {
            toast.error("Some files were skipped because they are not image files.");
        }
        
        // Process each image file
        imageFiles.forEach(file => {
            // Create preview URL using FileReader to avoid CSP issues
            const reader = new FileReader();
            reader.onload = () => {
                setFiles(prev => [...prev, file]);
                setPreviewUrls(prev => [...prev, reader.result]);
                const defaultName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
                append({ name: defaultName });
            };
            reader.onerror = () => {
                console.error("Error reading file:", reader.error);
                toast.error("Error processing image file.");
            };
            reader.readAsDataURL(file);
        });
    };

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            // Clean up any blob URLs that might still be in memory
            previewUrls.forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [previewUrls]);

    // Drag & drop handlers for upload area
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) {
            handleAddFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    // Resize an image file (if larger than MAX_DIMENSION) before upload
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

    // Submit handler to upload selected new images to Cloudinary (via API)
    const onSubmit = async (values) => {
        if (!files.length) {
            toast.error("Please select at least one image to upload.");
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const name = values.images[i]?.name || "";
                const fileToUpload = await resizeImageFile(file);
                formData.append("files[]", fileToUpload);
                formData.append("names[]", name);
            }
            await imagesApi.create(formData);
            toast.success("Images uploaded successfully!");
            // Reset form and refresh image list
            setFiles([]);
            setPreviewUrls([]);
            form.reset({ images: [] });
            const res = await imagesApi.list({ search: debouncedSearch });
            setImagesList(res.data || []);
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                // Map validation errors to form fields
                for (const [field, messages] of Object.entries(err.response.data.errors)) {
                    if (field.startsWith("names") && messages.length) {
                        const index = field.split(".")[1];
                        form.setError(`images.${index}.name`, { type: "manual", message: messages.join(", ") });
                    }
                    if (field.startsWith("files") && messages.length) {
                        toast.error(messages.join(", "));
                    }
                }
                toast.error("Please fix the highlighted errors and try again.");
            } else {
                toast.error(err.response?.data?.message || "Failed to upload images. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete an existing image (calls API then updates state)
    const handleDeleteImage = async (id) => {

        setIsSubmitting(true);
        try {
            await imagesApi.remove(id);
            toast.success("Image deleted.");
            setImagesList(prev => prev.filter(img => img.id !== id));
        } catch {
            toast.error("Failed to delete image.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <Title align="left" font="outfit" title="Images" subTitle="Upload and manage images for rooms." />

            {/* Search bar for filtering images */}
            <div className="mt-4 max-w-xs">
                <Input
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid of existing images with delete overlay */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {imagesList.map(image => (
                    <div key={image.id} className="relative group">
                        <img
                            src={image.secure_image_url}
                            alt={image.name || "Image"}
                            className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 truncate">
                            {image.name}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition group-hover:flex hidden">
                            <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteImageId(image.id)}>
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Drag & drop upload area for new images */}
            <div
                className="mt-6 p-6 border border-dashed border-gray-300 rounded-lg text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <img src={assets.uploadArea} alt="Upload" className="h-12 mx-auto mb-2 opacity-70" />
                <p className="text-sm text-muted-foreground">Drag & drop images here, or click to browse files</p>
                <p className="text-xs text-gray-500 mt-1">You can upload up to {MAX_BATCH} images at a time. Large images will be automatically resized.</p>
            </div>
            <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => { if (e.target.files) handleAddFiles(e.target.files); e.target.value = null; }}
            />

            {/* List of selected files (with name inputs) and upload button */}
            {fields.length > 0 && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        {fields.map((field, index) => (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={`images.${index}.name`}
                                rules={{ required: "Image name is required" }}
                                render={({ field: nameField }) => (
                                    <FormItem className="border rounded-md p-3 flex items-center justify-between">
                                        {/* Preview and name input */}
                                        <div className="flex items-center space-x-3 flex-1">
                                            <img
                                                src={previewUrls[index]}
                                                alt="Preview"
                                                className="w-16 h-16 object-cover rounded-md border"
                                            />
                                            <FormControl className="flex-1">
                                                <Input
                                                    {...nameField}
                                                    placeholder="Image name (for search)"
                                                    className="bg-background"
                                                />
                                            </FormControl>
                                        </div>
                                        {/* Remove file button */}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                // Clean up preview URL if it's a blob URL
                                                if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
                                                    URL.revokeObjectURL(previewUrls[index]);
                                                }
                                                remove(index);
                                                setFiles(prev => prev.filter((_, i) => i !== index));
                                                setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                                            }}
                                        >
                                            Remove
                                        </Button>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Uploading..." : "Upload Images"}
                        </Button>
                    </form>
                </Form>
            )}
            <DeleteDialog
                open={!!confirmDeleteImageId}
                onOpenChange={open => !open && setConfirmDeleteImageId(null)}
                onConfirm={async () => {
                    await handleDeleteImage(confirmDeleteImageId);
                    setConfirmDeleteImageId(null);
                }}
                title="Delete Image"
                description="Are you sure you want to delete this image? This action cannot be undone."
            />
            {isSubmitting && <Loader />}
        </div>
    );
};

export default ManageImages;
