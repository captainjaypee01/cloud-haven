import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import FormSelectField from "@/components/common/form/FormSelectField";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { formatCurrency } from "@/utils/currency";

const paymentProviders = [
    { value: 'bank_bdo', label: 'Bank Transfer (BDO)' },
];

const MAX_DIMENSION = 1920;

const formSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    transaction_id: z.string().optional(),
    remarks: z.string().optional(),
    proof: z.any().refine((file) => file && file instanceof File, "Proof of payment image is required")
        .refine((file) => file && file.type.startsWith("image/"), "Please upload an image file")
        .refine((file) => file && file.size <= 12 * 1024 * 1024, "Image must be less than 12MB"),
});

const ProofOfPaymentDialog = ({ open, onOpenChange, booking, paymentOption, onSuccess }) => {
    const api = useApi();
    const [submitting, setSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: "bank_bdo",
            transaction_id: "",
            remarks: "",
            proof: null,
        },
    });

    const { watch, setValue, reset } = form;
    const proofFile = watch("proof");

    // Cleanup preview URL when component unmounts or dialog closes
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

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

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file.");
            return;
        }

        try {
            // Clean up previous preview
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            // Set original file first for form validation
            setValue("proof", file);
            
            // Create preview URL - use setTimeout to ensure proper rendering
            const url = URL.createObjectURL(file);
            setTimeout(() => {
                setPreviewUrl(url);
            }, 10);

        } catch (error) {
            console.error("Error handling file:", error);
            toast.error("Error processing image file.");
        }
    };

    const handleSubmit = async (values) => {
        if (!booking || !paymentOption) return;

        setSubmitting(true);
        try {
            // Optimize the image before upload
            const optimizedFile = await resizeImageFile(values.proof);
            
            const formData = new FormData();
            formData.append("amount", String(paymentOption.amount));
            formData.append("provider", values.provider);
            if (values.transaction_id) formData.append("transaction_id", values.transaction_id);
            if (values.remarks) formData.append("remarks", values.remarks);
            formData.append("proof", optimizedFile);

            const res = await api.post(
                `${API_PREFIX}/bookings/ref/${booking.reference_number || booking.reference_no}/pay/upload-proof`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data?.success) {
                onSuccess && onSuccess();
                handleClose();
            } else {
                toast.error(res.data?.error_message || res.data?.message || "Upload failed");
            }
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                // Map validation errors to form fields
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    form.setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error("Please fix the errors in the form.");
            } else {
                toast.error(err.response?.data?.error_message || "Upload error. Try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        // Clean up preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        reset();
        setPreviewUrl(null);
        onOpenChange(false);
    };

    if (!paymentOption) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Proof of Payment</DialogTitle>
                    <div className="text-sm text-muted-foreground mt-2">
                        <div>Payment Type: <span className="font-medium">{paymentOption.label}</span></div>
                        <div>Amount: <span className="font-medium text-cyan-700">{formatCurrency(paymentOption.amount)}</span></div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormSelectField
                            name="provider"
                            control={form.control}
                            label="Payment Method"
                            options={paymentProviders}
                            required
                        />

                        <FormField
                            name="transaction_id"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction/Reference Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="e.g., GCash reference number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="proof"
                            control={form.control}
                            render={() => (
                                <FormItem>
                                    <FormLabel>Proof of Payment Image</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="cursor-pointer"
                                            />
                                            {previewUrl && (
                                                <div className="mt-2">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="max-w-full max-h-40 object-contain border rounded"
                                                        onLoad={() => {
                                                            // Ensure image loads properly in production
                                                            console.log("Preview image loaded successfully");
                                                        }}
                                                        onError={(e) => {
                                                            console.error("Preview image failed to load:", e);
                                                            // Fallback: try to recreate the preview URL
                                                            if (proofFile) {
                                                                const newUrl = URL.createObjectURL(proofFile);
                                                                e.target.src = newUrl;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    <div className="text-xs text-muted-foreground">
                                        Upload a screenshot or photo of your payment confirmation. Max 12MB.
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="remarks"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any additional notes about your payment..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || !proofFile}
                                className="cursor-pointer"
                            >
                                {submitting ? "Uploading..." : "Submit Proof"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ProofOfPaymentDialog;
