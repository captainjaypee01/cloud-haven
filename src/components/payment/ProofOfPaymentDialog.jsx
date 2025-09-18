import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Upload, FileText, X, Image as ImageIcon } from "lucide-react";

const paymentProviders = [
    { value: 'bank_bdo', label: 'Bank Transfer (BDO)' },
];

const MAX_DIMENSION = 1920;
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
const QUALITY = 0.8;

const formSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    transaction_id: z.string().optional(),
    remarks: z.string().optional(),
    proof_file: z.any().refine((file) => file && file instanceof File, "Proof of payment image is required")
        .refine((file) => file && file.type.startsWith("image/"), "Please upload an image file")
        .refine((file) => file && file.size <= MAX_FILE_SIZE, "Image must be less than 12MB"),
});

const ProofOfPaymentDialog = ({ open, onOpenChange, booking, paymentOption, onSuccess }) => {
    const api = useApi();
    const [submitting, setSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showUploadLimitDialog, setShowUploadLimitDialog] = useState(false);
    const [existingPayment, setExistingPayment] = useState(null);
    const [shouldCreateNew, setShouldCreateNew] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: "bank_bdo",
            transaction_id: "",
            remarks: "",
            proof_file: null,
        },
    });

    const { watch, setValue, reset } = form;
    const proofFile = watch("proof_file");

    // Check for existing payments when dialog opens
    const checkExistingPayments = useCallback(() => {
        // Look for existing payment with same amount
        const existingPaymentForAmount = booking.payments?.find(payment => 
            Math.abs(payment.amount - paymentOption.amount) < 0.01 // Allow for floating point differences
        );

        if (existingPaymentForAmount) {
            // Same payment type and amount - check if we can add more proofs
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
    }, [booking, paymentOption]);

    useEffect(() => {
        if (open && booking && paymentOption) {
            checkExistingPayments();
        }
    }, [open, booking, paymentOption, checkExistingPayments]);

    // Cleanup preview URL when component unmounts or dialog closes
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
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
                }, file.type.includes("png") ? "image/png" : "image/jpeg", QUALITY);
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

        if (file.size > MAX_FILE_SIZE) {
            toast.error(`Image must be less than ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`);
            return;
        }

        try {
            // Clean up previous preview
            if (previewUrl) {
                // Only revoke if it's a blob URL
                if (previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
            }

            // Set original file first for form validation
            setValue("proof_file", file);
            
            // Create data URL instead of blob URL to avoid CSP issues
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result);
            };
            reader.onerror = () => {
                console.error("Error reading file:", reader.error);
                toast.error("Error processing image file.");
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error("Error handling file:", error);
            toast.error("Error processing image file.");
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileChange({ target: { files: [file] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleSubmit = async (values) => {
        if (!booking || !paymentOption) return;

        setSubmitting(true);
        setUploadProgress(0);
        
        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);
            
            // Optimize the image before upload
            const optimizedFile = await resizeImageFile(values.proof_file);
            
            const formData = new FormData();
            
            if (existingPayment && !shouldCreateNew) {
                // Upload proof to existing payment using new system
                formData.append("proof_file", optimizedFile);
                
                const res = await api.post(
                    `${API_PREFIX}/bookings/ref/${booking.reference_number || booking.reference_no}/payments/${existingPayment.id}/proof`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (res.data?.success) {
                    toast.success(`Proof uploaded successfully! (${res.data.data.upload_count}/${res.data.data.max_uploads})`);
                    setTimeout(() => {
                        onSuccess && onSuccess();
                        handleClose();
                    }, 500);
                } else {
                    toast.error(res.data?.message || "Upload failed");
                }
            } else {
                // Create new payment with proof (legacy behavior)
                formData.append("amount", String(paymentOption.amount));
                formData.append("provider", values.provider);
                if (values.transaction_id) formData.append("transaction_id", values.transaction_id);
                if (values.remarks) formData.append("remarks", values.remarks);
                formData.append("proof_file", optimizedFile);

                const res = await api.post(
                    `${API_PREFIX}/bookings/ref/${booking.reference_number || booking.reference_no}/pay/upload-proof`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (res.data?.success) {
                    toast.success("Payment proof uploaded successfully!");
                    setTimeout(() => {
                        onSuccess && onSuccess();
                        handleClose();
                    }, 500);
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
                console.error('Payment proof error:', err)
                toast.error(err.response?.data?.message || err.response?.data?.error_message || "Upload error. Try again.");
            }
        } finally {
            setSubmitting(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };

    const handleClose = () => {
        // Clean up preview URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        reset();
        setPreviewUrl(null);
        setExistingPayment(null);
        setShouldCreateNew(false);
        setShowUploadLimitDialog(false);
        setUploadProgress(0);
        setIsDragging(false);
        onOpenChange(false);
    };

    if (!paymentOption) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-lg font-semibold">Upload Proof of Payment</DialogTitle>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div>
                                    <div className="font-medium text-blue-900">Payment Type</div>
                                    <div className="text-blue-700">{paymentOption.label}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-blue-900">Amount</div>
                                    <div className="text-xl font-bold text-cyan-700">{formatCurrency(paymentOption.amount)}</div>
                                </div>
                            </div>
                            
                            {existingPayment && !shouldCreateNew && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="text-xs">
                                            Uploads: {existingPayment.proof_upload_count || 0}/3
                                        </Badge>
                                        <Badge variant={existingPayment.proof_status === 'accepted' ? 'default' : 
                                                      existingPayment.proof_status === 'pending' ? 'secondary' : 
                                                      existingPayment.proof_status === 'rejected' ? 'destructive' : 'outline'}>
                                            {existingPayment.proof_status || 'none'}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        Found existing payment - uploading additional proof
                                    </div>
                                </div>
                            )}
                            {!existingPayment && shouldCreateNew && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="text-sm text-green-700">
                                        Creating new payment for this amount
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            {/* Bank Details - Mobile First */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-3 text-sm">Bank Details</h4>
                                <div className="space-y-2 text-sm text-blue-800">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Bank:</span>
                                        <span>BDO Unibank</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Account Name:</span>
                                        <span className="text-right max-w-[200px]">NETANIA DE LAIYA INC.</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Account Number:</span>
                                        <span className="font-mono">004978007114</span>
                                    </div>
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
                                name="proof_file"
                                control={form.control}
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Proof of Payment Image</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4">
                                                {!proofFile ? (
                                                    <div
                                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                                                            isDragging 
                                                                ? 'border-primary bg-primary/5 scale-105' 
                                                                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                                                        }`}
                                                        onDrop={handleDrop}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                                <Upload className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-medium text-foreground">
                                                                    Upload proof of payment
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Drag & drop or click to select (JPEG, PNG - Max 12MB)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {/* Selected File Preview */}
                                                        <div className="relative border border-primary/20 rounded-lg p-4 bg-primary/5">
                                                            <div className="flex items-start gap-3">
                                                                <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                                                                    <FileText className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-foreground truncate">
                                                                        {proofFile.name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setValue("proof_file", null);
                                                                        setPreviewUrl(null);
                                                                    }}
                                                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            
                                                            {/* Image Preview */}
                                                            {previewUrl && (
                                                                <div className="mt-3 relative">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-xs text-muted-foreground">Preview</span>
                                                                    </div>
                                                                    <img
                                                                        src={previewUrl}
                                                                        alt="Payment proof preview"
                                                                        className="w-full max-h-32 object-contain border rounded-md bg-white"
                                                                        onLoad={() => {
                                                                        }}
                                                                        onError={(e) => {
                                                                            console.error("Preview image failed to load:", e);
                                                                            // Fallback: try to recreate the preview using FileReader
                                                                            if (proofFile) {
                                                                                const reader = new FileReader();
                                                                                reader.onload = () => {
                                                                                    e.target.src = reader.result;
                                                                                };
                                                                                reader.readAsDataURL(proofFile);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Upload Progress */}
                                                        {uploadProgress > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-muted-foreground">Uploading...</span>
                                                                    <span className="font-medium">{uploadProgress}%</span>
                                                                </div>
                                                                <Progress value={uploadProgress} className="h-2" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
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

                            <DialogFooter className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={submitting}
                                    className="min-w-[100px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || !proofFile}
                                    className="min-w-[150px] cursor-pointer"
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
