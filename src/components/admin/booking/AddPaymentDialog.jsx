// components/admin/AddPaymentDialog.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import FormSelectField from '@/components/common/form/FormSelectField';
import { Upload, X, FileImage, FileText, Image as ImageIcon } from 'lucide-react';

const paymentProviders = [
    { value: 'netania', label: 'Netania' },
    { value: 'cash', label: 'Cash (On-site)' },
    { value: 'gcash', label: 'GCash' },
    { value: 'bank_bdo', label: 'Bank Transfer (BDO)' },
];

const MAX_DIMENSION = 1920;
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
const QUALITY = 0.8;

const paymentStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
];

const downpaymentStatusOptions = [
    { value: 'none', label: 'None' },
    { value: 'downpayment', label: 'Downpayment' },
];

import { resizeImageFile } from '@/utils/resizeImageFile';

const AddPaymentDialog = ({ open, onOpenChange, bookingReferenceNumber, onSuccess, payment, isEdit, booking }) => {
    const api = useApi();
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    
    // Determine if proof upload should be shown and allowed
    const canUploadProof = () => {
        // For new payments, always allow if provider requires proof
        if (!isEdit || !payment) return true;
        
        // For existing payments, check if proof can be modified
        // This will be determined by backend logic, but we can make some frontend checks
        if (!payment.proof_last_file_path) return true;
        
        // If it's a walk-in booking, allow until approved
        if (booking?.booking_source === 'walkin' && payment.proof_status !== 'accepted') {
            return true;
        }
        
        // If it's an online booking with guest-uploaded proof, don't allow staff to change it
        if (booking?.booking_source === 'online' && payment.proof_uploaded_by === 'guest') {
            return false;
        }
        
        // If it's staff-uploaded proof and not approved, allow modification
        if (payment.proof_uploaded_by === 'staff' && payment.proof_status !== 'accepted') {
            return true;
        }
        
        return false;
    };
    
    const showProofUpload = canUploadProof();
    
    // Simple form schema without dynamic validation
    const formSchema = z.object({
        amount: z.coerce.number().min(0.01, 'Amount is required'),
        provider: z.string().min(1, 'Provider is required'),
        status: z.string().min(1, 'Status is required'),
        downpayment_status: z.string().optional(),
        transaction_id: z.string().optional(),
        remarks: z.string().optional(),
        notify_guest: z.boolean().default(true),
        proof_file: z.any().optional(),
    });
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            provider: 'cash',
            status: 'paid',
            downpayment_status: 'none',
            transaction_id: '',
            remarks: '',
            notify_guest: true,
            proof_file: null,
        },
    });
    const { setError, reset, watch } = form;
    
    const selectedProvider = watch('provider');
    const requiresProof = ['gcash', 'bank_bdo'].includes(selectedProvider);
    
    // Check if booking already has a downpayment (excluding the current payment being edited)
    const hasExistingDownpayment = booking?.payments?.some(p => 
        p.downpayment_status === 'downpayment' && 
        (!isEdit || p.id !== payment?.id)
    );
    
    // Show downpayment option if:
    // 1. No existing downpayment in the booking, OR
    // 2. We're editing the existing downpayment (to allow changing it)
    const canSetDownpayment = !hasExistingDownpayment || (isEdit && payment?.downpayment_status === 'downpayment');
    
    // Filter downpayment options based on availability
    const availableDownpaymentOptions = canSetDownpayment 
        ? downpaymentStatusOptions 
        : downpaymentStatusOptions.filter(option => option.value === 'none');

    useEffect(() => {
        if (!open) {
            // Reset form when dialog closes
            reset();
            setProofFile(null);
            // Clean up preview URL
            if (proofPreview && proofPreview.startsWith('blob:')) {
                URL.revokeObjectURL(proofPreview);
            }
            setProofPreview(null);
            setIsDragging(false);
        }
        // eslint-disable-next-line
    }, [open]);

    // Separate effect for handling form data when dialog is open
    useEffect(() => {
        if (open) {
            if (payment && isEdit) {
                // Editing existing payment
                reset({
                    amount: payment.amount || '',
                    provider: payment.provider || 'cash',
                    status: payment.status || 'paid',
                    downpayment_status: payment.downpayment_status || 'none',
                    transaction_id: payment.transaction_id || '',
                    remarks: payment.remarks || '',
                    notify_guest: true,
                    proof_file: null,
                });
            } else {
                // Adding new payment - always reset to defaults
                reset({
                    amount: '',
                    provider: 'cash',
                    status: 'paid',
                    downpayment_status: 'none',
                    transaction_id: '',
                    remarks: '',
                    notify_guest: true,
                    proof_file: null,
                });
            }
        }
        // eslint-disable-next-line
    }, [open, payment, isEdit, reset]);

    // Auto-set downpayment_status to 'none' if not available (only for new payments, not when editing)
    useEffect(() => {
        if (!canSetDownpayment && !isEdit && form.getValues('downpayment_status') === 'downpayment') {
            form.setValue('downpayment_status', 'none');
        }
    }, [canSetDownpayment, isEdit, form]);

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
            if (proofPreview) {
                // Only revoke if it's a blob URL
                if (proofPreview.startsWith('blob:')) {
                    URL.revokeObjectURL(proofPreview);
                }
            }

            // Set original file first for form validation
            setProofFile(file);
            form.setValue('proof_file', file);
            
            // Create data URL instead of blob URL to avoid CSP issues
            const reader = new FileReader();
            reader.onload = () => {
                setProofPreview(reader.result);
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

    const removeProofFile = () => {
        // Clean up preview URL
        if (proofPreview && proofPreview.startsWith('blob:')) {
            URL.revokeObjectURL(proofPreview);
        }
        setProofFile(null);
        setProofPreview(null);
        form.setValue('proof_file', null);
    };

    const handleSubmit = async (values) => {
        // Manual validation for proof file requirement
        if (requiresProof && showProofUpload && !proofFile) {
            setError('proof_file', {
                type: 'manual',
                message: 'Proof of payment is required for GCash and Bank Transfer payments'
            });
            return;
        }
        
        try {
            if (isEdit && payment?.id) {
                // For edit, handle file upload if provided
                if (proofFile) {
                    // Optimize the image before upload
                    const optimizedFile = await resizeImageFile(proofFile);
                    
                    const formData = new FormData();
                    formData.append('_method', 'PUT');
                    formData.append('amount', values.amount.toString());
                    formData.append('provider', values.provider);
                    formData.append('status', values.status);
                    formData.append('downpayment_status', values.downpayment_status || 'none');
                    formData.append('transaction_id', values.transaction_id || '');
                    formData.append('remarks', values.remarks || '');
                    formData.append('notify_guest', values.notify_guest ? '1' : '0');
                    formData.append('proof_file', optimizedFile);
                    
                    await api.post(`${API_PREFIX}/admin/payments/${payment.id}`, formData, { 
                        requiresAuth: true
                    });
                } else {
                    await api.put(`${API_PREFIX}/admin/payments/${payment.id}`, values, { requiresAuth: true });
                }
                // Check if proof was auto-accepted during edit (staff uploads are always auto-accepted)
                const isStaffUploadWithProof = requiresProof && 
                    proofFile && 
                    ['gcash', 'bank_bdo'].includes(values.provider);
                
                if (isStaffUploadWithProof) {
                    toast.success('Payment updated successfully. Proof of payment has been automatically accepted since it was uploaded by staff.');
                } else {
                    toast.success('Payment updated');
                }
            } else {
                // For new payments, handle file upload if required
                const formData = new FormData();
                formData.append('reference_number', bookingReferenceNumber);
                formData.append('amount', values.amount);
                formData.append('provider', values.provider);
                formData.append('status', values.status);
                formData.append('downpayment_status', values.downpayment_status || 'none');
                formData.append('transaction_id', values.transaction_id || '');
                formData.append('remarks', values.remarks || '');
                formData.append('notify_guest', values.notify_guest ? '1' : '0');
                
                // Add proof file if required and provided
                if (requiresProof && proofFile) {
                    // Optimize the image before upload
                    const optimizedFile = await resizeImageFile(proofFile);
                    formData.append('proof_file', optimizedFile);
                }
                
                await api.post(`${API_PREFIX}/admin/payments/pay`, formData, { 
                    requiresAuth: true
                });
                // Check if proof was auto-accepted (staff uploads are always auto-accepted)
                const isStaffUploadWithProof = requiresProof && 
                    proofFile && 
                    ['gcash', 'bank_bdo'].includes(values.provider);
                
                if (isStaffUploadWithProof) {
                    toast.success('Payment added successfully. Proof of payment has been automatically accepted since it was uploaded by staff.');
                } else {
                    toast.success('Payment added');
                }
            }
            if (onSuccess) onSuccess();
            onOpenChange(false);
            reset();
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                Object.entries(err.response.data.errors).forEach(([field, messages]) => {
                    setError(field, { type: "manual", message: messages.join(", ") });
                });
                toast.error("Please fix the errors in the form.");
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error(isEdit ? 'Update Failed' : 'Payment Failed');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{isEdit ? 'Edit Payment' : 'Add Manual Payment'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <FormField name="amount" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl><Input type="number" min={0.01} step={0.01} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="transaction_id" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction/Reference No</FormLabel>
                                <FormControl><Input type="text" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField name="remarks" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Remarks</FormLabel>
                                <FormControl><Input type="text" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormSelectField
                            name="provider"
                            control={form.control}
                            label="Provider"
                            options={paymentProviders}
                        />
                        <FormSelectField
                            name="status"
                            control={form.control}
                            label="Status"
                            options={paymentStatusOptions}
                        />
                        <FormSelectField
                            name="downpayment_status"
                            control={form.control}
                            label="Downpayment Status"
                            options={availableDownpaymentOptions}
                        />
                        
                        {/* Show info message when downpayment option is not available */}
                        {!canSetDownpayment && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <div className="text-blue-600 mt-0.5 flex-shrink-0">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium text-blue-900">Downpayment Status</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            This booking already has a downpayment. Additional payments cannot be marked as downpayment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Proof of Payment Upload - Only show when allowed */}
                        {showProofUpload && (
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
                                                        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 ${
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
                                                                    onClick={removeProofFile}
                                                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            
                                                            {/* Image Preview */}
                                                            {proofPreview && (
                                                                <div className="mt-3 relative">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-xs text-muted-foreground">Preview</span>
                                                                    </div>
                                                                    <img
                                                                        src={proofPreview}
                                                                        alt="Payment proof preview"
                                                                        className="w-full max-h-24 sm:max-h-32 object-contain border rounded-md bg-white"
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
                        )}
                        
                        {/* Show message when proof is required but cannot be uploaded */}
                        {requiresProof && !showProofUpload && payment?.proof_last_file_path && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <FileImage className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium text-blue-900">Proof of Payment</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            {payment.proof_uploaded_by === 'guest' 
                                                ? 'This payment has a proof uploaded by the guest. Staff cannot modify guest-uploaded proofs.'
                                                : payment.proof_status === 'accepted'
                                                    ? 'This payment proof has been approved and cannot be modified.'
                                                    : 'Proof of payment is already uploaded and cannot be modified.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <FormField
                            name="notify_guest"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Notify guest via email
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            Send confirmation/problem notification email when status changes
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        </form>
                    </Form>
                </div>
                <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                    <Button
                        type="submit"
                        className="cursor-pointer w-full sm:w-auto"
                        disabled={form.formState.isSubmitting}
                        onClick={form.handleSubmit(handleSubmit)}
                    >
                        {form.formState.isSubmitting ? (isEdit ? 'Saving...' : 'Saving...') : (isEdit ? 'Update Payment' : 'Add Payment')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;
