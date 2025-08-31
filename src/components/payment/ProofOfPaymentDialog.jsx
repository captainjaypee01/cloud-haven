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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

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
    const [showUploadLimitDialog, setShowUploadLimitDialog] = useState(false);
    const [existingPayment, setExistingPayment] = useState(null);
    const [shouldCreateNew, setShouldCreateNew] = useState(false);

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

    // Check for existing payments when dialog opens
    useEffect(() => {
        if (open && booking && paymentOption) {
            checkExistingPayments();
        }
    }, [open, booking, paymentOption]);

    const checkExistingPayments = () => {
        // Look for existing payment with same amount
        const existingPaymentForAmount = booking.payments?.find(payment => 
            Math.abs(payment.amount - paymentOption.amount) < 0.01 // Allow for floating point differences
        );

        if (existingPaymentForAmount) {
            setExistingPayment(existingPaymentForAmount);
            const maxUploads = 3;
            const currentUploads = existingPaymentForAmount.proof_upload_count || 0;
            const proofStatus = existingPaymentForAmount.proof_status || 'none';
            
            // Check if user can upload
            const canUpload = currentUploads < maxUploads && 
                             (proofStatus === 'none' || proofStatus === 'rejected');
            
            if (!canUpload) {
                setShouldCreateNew(false);
                if (proofStatus === 'accepted') {
                    toast.info('Payment proof already accepted for this amount.');
                } else if (proofStatus === 'pending') {
                    toast.info('Payment proof under review for this amount.');
                } else {
                    // Limit reached
                    setShowUploadLimitDialog(true);
                }
                return;
            }
            setShouldCreateNew(false);
        } else {
            setExistingPayment(null);
            setShouldCreateNew(true);
        }
    };

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
            
            if (existingPayment && !shouldCreateNew) {
                // Upload proof to existing payment using new system
                formData.append("proof_file", optimizedFile);
                
                const res = await api.post(
                    `${API_PREFIX}/bookings/ref/${booking.reference_number || booking.reference_no}/payments/${existingPayment.id}/proof`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                if (res.data?.success) {
                    toast.success(`Proof uploaded successfully! (${res.data.data.upload_count}/${res.data.data.max_uploads})`);
                    onSuccess && onSuccess();
                    handleClose();
                } else {
                    toast.error(res.data?.message || "Upload failed");
                }
            } else {
                // Create new payment with proof (legacy behavior)
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
                    toast.success("Payment proof uploaded successfully!");
                    onSuccess && onSuccess();
                    handleClose();
                } else {
                    toast.error(res.data?.error_message || res.data?.message || "Upload failed");
                }
            }
        } catch (err) {
            if (err.response?.status === 429 && err.response.data?.error_code === 'proof_upload_limit_reached') {
                toast.error(err.response.data.message);
                setShowUploadLimitDialog(true);
            } else if (err.response?.status === 422 && err.response.data?.errors) {
                // Map validation errors to form fields
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    form.setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error("Please fix the errors in the form.");
            } else {
                toast.error(err.response?.data?.message || err.response?.data?.error_message || "Upload error. Try again.");
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
        setExistingPayment(null);
        setShouldCreateNew(false);
        setShowUploadLimitDialog(false);
        onOpenChange(false);
    };

    if (!paymentOption) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Proof of Payment</DialogTitle>
                        <div className="text-sm text-muted-foreground mt-2">
                            <div>Payment Type: <span className="font-medium">{paymentOption.label}</span></div>
                            <div>Amount: <span className="font-medium text-cyan-700">{formatCurrency(paymentOption.amount)}</span></div>
                            {existingPayment && !shouldCreateNew && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                            Uploads: {existingPayment.proof_upload_count || 0}/3
                                        </Badge>
                                        <Badge variant={existingPayment.proof_status === 'accepted' ? 'default' : 
                                                      existingPayment.proof_status === 'pending' ? 'secondary' : 
                                                      existingPayment.proof_status === 'rejected' ? 'destructive' : 'outline'}>
                                            {existingPayment.proof_status || 'none'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1">
                                        Found existing payment - uploading additional proof
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Bank Details */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Bank Details</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                                <div><span className="font-medium">Bank:</span> BDO Unibank</div>
                                <div><span className="font-medium">Account Name:</span> NETANIA DE LAIYA INC.</div>
                                <div><span className="font-medium">Account Number:</span> 004978007114</div>
                            </div>
                        </div>

                        {(shouldCreateNew || !existingPayment) && (
                            <FormSelectField
                                name="provider"
                                control={form.control}
                                label="Payment Method"
                                options={paymentProviders}
                                required
                            />
                        )}

                        <FormField
                            name="transaction_id"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction/Reference Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="e.g., BDO reference number, online banking confirmation"
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
                                {submitting ? "Uploading..." : 
                                 existingPayment && !shouldCreateNew ? "Upload Additional Proof" : "Submit Proof"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        {/* Upload Limit Alert Dialog */}
        <AlertDialog open={showUploadLimitDialog} onOpenChange={setShowUploadLimitDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Upload Limit Reached</AlertDialogTitle>
                    <AlertDialogDescription>
                        This payment has reached the maximum number of proof uploads (3). 
                        Please contact support if you need to upload additional proof.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowUploadLimitDialog(false)} className="cursor-pointer">
                        OK
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};

export default ProofOfPaymentDialog;
