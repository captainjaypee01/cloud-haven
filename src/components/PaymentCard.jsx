import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/useApi';
import { useLoader } from '@/context/LoaderContext';
import { API_PREFIX } from '@/constants/api';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';
import { BadgeCheckIcon, BadgeAlertIcon, Upload, FileText, X, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ProofImageDialog from '@/components/admin/booking/ProofImageDialog';
import { formatSingaporeDateTime } from '@/utils/dateUtils';

const PaymentCard = ({ payment, onPaymentUpdate, booking }) => {
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [remarks, setRemarks] = useState('');
    const fileInputRef = useRef(null);
    const api = useApi();
    const { show, hide } = useLoader();

    const maxUploads = 3;
    const currentUploads = payment.proof_upload_count || 0;
    const proofStatus = payment.proof_status || 'none';
    
    // Determine if user can upload based on count, status, and booking status
    const isBookingCancelled = booking?.status === 'cancelled';
    const canUpload = !isBookingCancelled && 
                     currentUploads < maxUploads && 
                     (proofStatus === 'none' || proofStatus === 'rejected');

    const handleFileSelect = (file) => {
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid file (JPEG, PNG, or PDF)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (!canUpload) {
            if (isBookingCancelled) {
                toast.error('Cannot upload proof - booking has been cancelled.');
            } else if (proofStatus === 'accepted') {
                toast.info('This payment proof has already been accepted by admin.');
            } else if (proofStatus === 'pending') {
                toast.info('Your proof is currently under review by admin.');
            } else {
                setShowUploadDialog(true);
            }
            return;
        }

        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    const handleUploadClick = () => {
        if (!canUpload) {
            if (isBookingCancelled) {
                toast.error('Cannot upload proof - booking has been cancelled.');
            } else if (proofStatus === 'accepted') {
                toast.info('This payment proof has already been accepted by admin.');
            } else if (proofStatus === 'pending') {
                toast.info('Your proof is currently under review by admin.');
            } else {
                setShowUploadDialog(true);
            }
            return;
        }
        fileInputRef.current?.click();
    };

    const uploadProof = async () => {
        if (!selectedFile) return;

        show();
        setUploadProgress(0);
        
        try {
            const formData = new FormData();
            formData.append('proof_file', selectedFile);
            if (transactionId) formData.append('transaction_id', transactionId);
            if (remarks) formData.append('remarks', remarks);

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            // Try authenticated route first (for registered users)
            let response;
            try {
                response = await api.post(
                    `${API_PREFIX}/user/payments/${payment.id}/proof`,
                    formData,
                    {
                        requiresAuth: true,
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );
            } catch (authError) {
                // If auth fails or user doesn't own payment, try guest route
                if (authError.response?.status === 401 || authError.response?.status === 403) {
                    // Fallback to guest route - need booking reference number
                    if (payment.booking?.reference_number) {
                        response = await api.post(
                            `${API_PREFIX}/bookings/ref/${payment.booking.reference_number}/payments/${payment.id}/proof`,
                            formData,
                            {
                                headers: { 'Content-Type': 'multipart/form-data' }
                            }
                        );
                    } else {
                        // If no booking reference, provide helpful error message
                        throw new Error('Unable to upload proof. This may be a guest booking. Please contact support with your booking reference number.');
                    }
                } else {
                    throw authError; // Re-throw other errors
                }
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.data.success) {
                toast.success('Proof of payment uploaded successfully!');
                setSelectedFile(null);
                setTransactionId('');
                setRemarks('');
                
                // Update the payment object with new data
                if (onPaymentUpdate) {
                    onPaymentUpdate(response.data.data.payment);
                }
            }
        } catch (error) {
            setUploadProgress(0);
            
            if (error.response?.data?.error_code === 'proof_upload_limit_reached') {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.error_code === 'booking_cancelled') {
                toast.error(error.response.data.message);
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to upload proof. Please try again.');
            }
        } finally {
            hide();
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };

    const renderUploadArea = () => {
        if (!canUpload) {
            if (isBookingCancelled) {
                return (
                    <div className="flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Booking cancelled - proof uploads not allowed</span>
                    </div>
                );
            } else if (proofStatus === 'accepted') {
                return (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Payment proof accepted by admin</span>
                    </div>
                );
            } else if (proofStatus === 'pending') {
                return (
                    <div className="flex items-center justify-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Proof under review by admin</span>
                    </div>
                );
            } else {
                return (
                    <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">Upload limit reached ({currentUploads}/{maxUploads})</span>
                    </div>
                );
            }
        }

                 if (selectedFile) {
             return (
                 <div className="space-y-4">
                     {/* Selected File */}
                     <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-primary/10 rounded-full">
                                 <FileText className="h-4 w-4 text-primary" />
                             </div>
                             <div>
                                 <div className="text-sm font-medium text-foreground">{selectedFile.name}</div>
                                 <div className="text-xs text-muted-foreground">
                                     {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                 </div>
                             </div>
                         </div>
                         <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setSelectedFile(null)}
                             className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                         >
                             <X className="h-4 w-4" />
                         </Button>
                     </div>

                     {/* Transaction ID and Remarks - Only shown when file is selected */}
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <label className="text-sm font-medium text-foreground">
                                 Transaction/Reference Number (Optional)
                             </label>
                             <Input
                                 type="text"
                                 placeholder="e.g., BDO reference number, online banking confirmation"
                                 value={transactionId}
                                 onChange={(e) => setTransactionId(e.target.value)}
                                 className="text-sm"
                             />
                         </div>

                         <div className="space-y-2">
                             <label className="text-sm font-medium text-foreground">
                                 Remarks (Optional)
                             </label>
                             <Textarea
                                 placeholder="Any additional notes about your payment..."
                                 value={remarks}
                                 onChange={(e) => setRemarks(e.target.value)}
                                 className="text-sm resize-none"
                                 rows={3}
                             />
                         </div>
                     </div>
                     
                     {uploadProgress > 0 && (
                         <div className="space-y-3">
                             <div className="space-y-1">
                                 <div className="flex justify-between text-xs">
                                     <span className="text-muted-foreground">Uploading...</span>
                                     <span className="font-medium">{uploadProgress}%</span>
                                 </div>
                                 <Progress value={uploadProgress} className="h-2" />
                             </div>
                         </div>
                     )}
                     
                     <div className="flex gap-3 pt-2">
                         <Button
                             onClick={uploadProof}
                             disabled={uploadProgress > 0}
                             className="flex-1"
                             size="lg"
                         >
                             {uploadProgress > 0 ? 'Uploading...' : 'Upload Proof'}
                         </Button>
                         <Button
                             variant="outline"
                             onClick={() => setSelectedFile(null)}
                             disabled={uploadProgress > 0}
                             size="lg"
                         >
                             Cancel
                         </Button>
                     </div>
                 </div>
             );
         }

        return (
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                        ? 'border-primary bg-primary/5 scale-105' 
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleUploadClick}
            >
                <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                            Upload proof of payment
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Drag & drop or click to select (JPEG, PNG, PDF - Max 5MB)
                        </div>
                    </div>
                </div>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Paid</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
            default:
                return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{status}</Badge>;
        }
    };

    const getProofStatusBadge = (proofStatus) => {
        switch (proofStatus) {
            case 'pending':
                return <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">Under Review</Badge>;
            case 'accepted':
                return <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">Proof Accepted</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">Proof Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="text-xl font-semibold text-primary">{formatCurrency(payment.amount)}</div>
                            <div className="text-sm text-muted-foreground">{payment.provider}</div>
                            {payment.local_created_at && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatSingaporeDateTime(payment.local_created_at)}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(payment.status)}
                            {payment.proof_status && payment.proof_status !== 'none' && 
                                getProofStatusBadge(payment.proof_status)
                            }
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">



                    {/* Upload Progress Indicator */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Upload Progress:</span>
                            <span className={`font-medium text-xs px-2 py-1 rounded-full ${
                                !canUpload ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {currentUploads}/{maxUploads} uploads
                            </span>
                        </div>
                        <Progress value={(currentUploads / maxUploads) * 100} className="h-2" />
                    </div>

                    

                     {/* Upload Area */}
                     {renderUploadArea()}

                                         {/* Payment Details Section */}
                    {(payment.transaction_id || payment.remarks || payment.proof_image_url) && (
                        <>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Payment Details</h4>
                                
                                {payment.transaction_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Reference No:</span>
                                        <span className="font-medium">{payment.transaction_id}</span>
                                    </div>
                                )}
                                
                                {payment.remarks && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground block mb-1">Remarks:</span>
                                        <p className="text-foreground bg-muted/50 p-2 rounded text-xs">{payment.remarks}</p>
                                    </div>
                                )}
                                
                                {payment.proof_image_url && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Proof of Payment:</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowImageDialog(true)}
                                            className="flex items-center gap-1 h-8"
                                        >
                                            <Eye className="h-3 w-3" />
                                            View Proof
                                        </Button>
                                    </div>
                                )}
                                
                                {payment.proof_last_uploaded_at && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Uploaded: {(() => {
                                            // Handle both raw dates and pre-formatted strings
                                            const uploadedAt = payment.proof_last_uploaded_at;
                                            if (uploadedAt instanceof Date || typeof uploadedAt === 'string' && uploadedAt.match(/^\d{4}-\d{2}-\d{2}/)) {
                                                // Raw date - convert to Singapore timezone
                                                return formatSingaporeDateTime(uploadedAt);
                                            } else {
                                                // Pre-formatted string - try to parse and convert
                                                try {
                                                    const date = new Date(uploadedAt);
                                                    if (!isNaN(date.getTime())) {
                                                        return formatSingaporeDateTime(date);
                                                    }
                                                } catch (e) {
                                                    // Could not parse date
                                                }
                                                // Fallback to original string
                                                return uploadedAt;
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>
                        </>
                    )}



                    {/* Rejection reason if exists */}
                    {payment.proof_status === 'rejected' && payment.proof_rejected_reason && (
                        <>
                            <Separator className="my-4" />
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-destructive">Proof Rejected</h4>
                                        <p className="text-sm text-destructive/80 mt-1">{payment.proof_rejected_reason}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Upload Limit Alert Dialog */}
            <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                                                        {proofStatus === 'accepted' ? 'Proof Already Accepted' :
                             proofStatus === 'pending' ? 'Proof Under Review' :
                             'Upload Limit Reached'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                                {proofStatus === 'accepted' 
                                ? 'This payment proof has already been accepted by admin. No further uploads are needed.'
                                : proofStatus === 'pending'
                                ? 'Your proof is currently under review by admin. Please wait for approval before uploading again.'
                                : `You have reached the maximum number of proof uploads (${maxUploads}) for this payment. Please contact support if you need to upload additional proof.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowUploadDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Proof Image Dialog */}
            <ProofImageDialog
                open={showImageDialog}
                onOpenChange={setShowImageDialog}
                imageUrl={payment.proof_image_url}
                paymentInfo={payment}
            />
        </>
    );
};

export default PaymentCard;
