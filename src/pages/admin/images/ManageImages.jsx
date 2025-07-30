// src/pages/admin/images/ManageImages.jsx (Admin Images upload/management page)
import React, { useRef, useState, useEffect } from "react";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useImagesApi } from "@/hooks/api/useImagesApi";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { assets } from "@/assets/assets";

const MAX_BATCH = 20;  // maximum images per upload batch
const MAX_DIMENSION = 1920;  // max width/height for resizing (pixels)

const ManageImages = () => {
    const imagesApi = useImagesApi();
    const fileInputRef = useRef(null);

    // React Hook Form setup for image names
    const form = useForm({
        defaultValues: { images: [] },
    });
    const { fields, append, remove } = useFieldArray({ name: "images", control: form.control });

    // We keep the actual File objects in a separate state array (aligned by index with form.fields)
    const [files, setFiles] = useState([]);

    // Handle adding files (from input or drop)
    const handleAddFiles = (fileList) => {
        const newFiles = Array.from(fileList);
        // Filter out non-image files
        const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"));
        if (imageFiles.length + files.length > MAX_BATCH) {
            toast.error(`You can only upload up to ${MAX_BATCH} images at a time.`);
            return;
        }
        // Append each new file and add a corresponding form field for its name
        imageFiles.forEach((file) => {
            setFiles((prev) => [...prev, file]);
            // Optionally, use file name (without extension) as initial name value
            const defaultName = file.name.replace(/\.[^/.]+$/, "");
            append({ name: defaultName });
        });
        // If some files were not images, show a warning
        if (imageFiles.length < newFiles.length) {
            toast.error("Some files were skipped because they are not image files.");
        }
    };

    // Drag & drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    // Function to resize an image file if it's too large (to MAX_DIMENSION)
    const resizeImageFile = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                // Determine new dimensions
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    // Scale down preserving aspect ratio
                    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                // Draw image onto canvas at new size
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                // Convert canvas back to blob (JPEG for photos, PNG for others to preserve transparency)
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Create a new File from the blob to mimic original file
                            const ext = file.type.includes("png") ? "png" : "jpg";
                            const newFile = new File([blob], file.name, { type: `image/${ext}` });
                            resolve(newFile);
                        } else {
                            // If conversion fails, fallback to original file
                            resolve(file);
                        }
                        URL.revokeObjectURL(url);
                    },
                    file.type.includes("png") ? "image/png" : "image/jpeg",
                    0.8  // use 80% quality for JPEG to reduce size
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(file);
            };
            // Start loading the image
            img.src = url;
        });
    };

    // Form submission handler: uploads all images
    const onSubmit = async (values) => {
        if (!files.length) {
            toast.error("Please select at least one image to upload.");
            return;
        }
        try {
            // Resize images if necessary and prepare FormData
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                const originalFile = files[i];
                const name = values.images[i]?.name || "";  // image name from form
                // If name is missing, we can enforce required validation via react-hook-form
                // (We added required rule below in the JSX for name input)
                const fileToUpload = await resizeImageFile(originalFile);
                formData.append("files[]", fileToUpload);
                formData.append("names[]", name);
            }
            // Send request to upload images
            await imagesApi.create(formData);
            toast.success("Images uploaded successfully!");
            // Reset form and state
            setFiles([]);
            form.reset({ images: [] });
            // TODO: optionally, refresh the image list if displaying existing images on this page
        } catch (err) {
            // Handle validation errors from backend (e.g., missing name) or other errors
            if (err.response?.status === 422 && err.response.data?.errors) {
                const errors = err.response.data.errors;
                // Map backend validation errors to form fields
                Object.entries(errors).forEach(([field, messages]) => {
                    // Example backend field names: "names.0", "names.1", "files.0" etc.
                    if (field.startsWith("names") && messages.length) {
                        // Extract index from "names.X"
                        const index = field.split(".")[1];
                        form.setError(`images.${index}.name`, {
                            type: "manual", message: messages.join(", ")
                        });
                    }
                    // If there are file errors (like invalid file type/size), show a general error:
                    if (field.startsWith("files") && messages.length) {
                        toast.error(messages.join(", "));
                    }
                });
                toast.error("Please fix the highlighted errors and try again.");
            } else {
                // General error handling
                toast.error(err.response?.data?.message || "Failed to upload images. Please try again.");
            }
        }
    };

    return (
        <div className="p-6">
            {/* Page Title */}
            <Title
                align="left"
                font="outfit"
                title="Images"
                subTitle="Upload and manage images for rooms."
            />

            {/* Drag & Drop Upload Area */}
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
                onChange={(e) => {
                    if (e.target.files) handleAddFiles(e.target.files);
                    // reset the input value so onChange will fire even if same file is re-selected
                    e.target.value = null;
                }}
            />

            {/* Selected Files List with Name Inputs */}
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
                                        {/* Image preview and name input */}
                                        <div className="flex items-center space-x-3 flex-1">
                                            <img
                                                src={URL.createObjectURL(files[index])}
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
                                        {/* Remove button for this image */}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                remove(index);
                                                setFiles(prev => prev.filter((_, i) => i !== index));
                                            }}
                                        >
                                            Remove
                                        </Button>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        {/* Submit Button */}
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Uploading..." : "Upload Images"}
                        </Button>
                    </form>
                </Form>
            )}
        </div>
    );
};

export default ManageImages;
