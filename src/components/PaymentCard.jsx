import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/useApi';
import { useLoader } from '@/context/LoaderContext';
import { API_PREFIX } from '@/constants/api';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';
import { BadgeCheckIcon, BadgeAlertIcon, Upload, FileText, X, Eye } from 'lucide-react';
import ProofImageDialog from '@/components/admin/booking/ProofImageDialog';

const PaymentCard = ({ payment, onPaymentUpdate }) => {
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
    
    // Determine if user can upload based on count AND status
    const canUpload = currentUploads < maxUploads && 
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
            if (proofStatus === 'accepted') {
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
            if (proofStatus === 'accepted') {
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
                        console.log('Falling back to guest route for booking:', payment.booking.reference_number);
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
            if (proofStatus === 'accepted') {
                return (
                    <div className="text-sm text-green-600 text-center py-2 bg-green-50 rounded border">
                        ✓ Payment proof accepted by admin
                    </div>
                );
            } else if (proofStatus === 'pending') {
                return (
                    <div className="text-sm text-yellow-600 text-center py-2 bg-yellow-50 rounded border">
                        ⏳ Proof under review by admin
                    </div>
                );
            } else {
                return (
                    <div className="text-sm text-gray-500 text-center py-2">
                        Upload limit reached ({currentUploads}/{maxUploads})
                    </div>
                );
            }
        }

                 if (selectedFile) {
             return (
                 <div className="space-y-4">
                     {/* Selected File */}
                     <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                         <div className="flex items-center gap-2">
                             <FileText className="h-4 w-4 text-green-600" />
                             <div>
                                 <div className="text-sm font-medium">{selectedFile.name}</div>
                                 <div className="text-xs text-gray-500">
                                     {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                 </div>
                             </div>
                         </div>
                         <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setSelectedFile(null)}
                             className="h-8 w-8 p-0 cursor-pointer"
                         >
                             <X className="h-4 w-4" />
                         </Button>
                     </div>

                     {/* Transaction ID and Remarks - Only shown when file is selected */}
                     <div className="space-y-3">
                         <div className="space-y-1">
                             <label className="text-sm font-medium text-gray-700">
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

                         <div className="space-y-1">
                             <label className="text-sm font-medium text-gray-700">
                                 Remarks (Optional)
                             </label>
                             <Textarea
                                 placeholder="Any additional notes about your payment..."
                                 value={remarks}
                                 onChange={(e) => setRemarks(e.target.value)}
                                 className="text-sm resize-none"
                                 rows={2}
                             />
                         </div>
                     </div>
                     
                     {uploadProgress > 0 && (
                         <div className="space-y-2">
                             <Progress value={uploadProgress} className="h-2" />
                             <div className="text-xs text-center text-gray-600">
                                 Uploading... {uploadProgress}%
                             </div>
                         </div>
                     )}
                     
                     <div className="flex gap-2">
                         <Button
                             onClick={uploadProof}
                             disabled={uploadProgress > 0}
                             className="flex-1 cursor-pointer"
                         >
                             {uploadProgress > 0 ? 'Uploading...' : 'Upload Proof'}
                         </Button>
                         <Button
                             variant="outline"
                             onClick={() => setSelectedFile(null)}
                             disabled={uploadProgress > 0}
                             className="cursor-pointer"
                         >
                             Cancel
                         </Button>
                     </div>
                 </div>
             );
         }

        return (
            <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragging 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleUploadClick}
            >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm font-medium text-gray-700 mb-1">
                    Upload proof of payment
                </div>
                <div className="text-xs text-gray-500">
                    Drag & drop or click to select (JPEG, PNG, PDF - Max 5MB)
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
                return <Badge variant="success"><BadgeCheckIcon className="h-3 w-3 mr-1" />Paid</Badge>;
            case 'pending':
                return <Badge variant="secondary"><BadgeAlertIcon className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'failed':
                return <Badge variant="destructive"><BadgeAlertIcon className="h-3 w-3 mr-1" />Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getProofStatusBadge = (proofStatus) => {
        switch (proofStatus) {
            case 'pending':
                return <Badge variant="warning" className="text-xs">Under Review</Badge>;
            case 'accepted':
                return <Badge variant="success" className="text-xs">Accepted</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <>
            <Card>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="font-medium text-lg">{formatCurrency(payment.amount)}</div>
                            <div className="text-sm text-gray-600">{payment.provider}</div>
                            {payment.local_created_at && (
                                <div className="text-xs text-gray-500">{payment.local_created_at}</div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {getStatusBadge(payment.status)}
                            {payment.proof_status && payment.proof_status !== 'none' && 
                                getProofStatusBadge(payment.proof_status)
                            }
                        </div>
                    </div>



                    {/* Upload Progress Indicator */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Proof uploads:</span>
                            <span className={`font-medium ${!canUpload ? 'text-red-600' : 'text-gray-800'}`}>
                                {currentUploads}/{maxUploads}
                            </span>
                        </div>
                        <Progress value={(currentUploads / maxUploads) * 100} className="h-1 mt-1" />
                    </div>

                    

                     {/* Upload Area */}
                     {renderUploadArea()}

                                         {/* Current payment details - Only show if there's data */}
                     {(payment.transaction_id || payment.remarks) && (
                         <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                             {payment.transaction_id && (
                                 <div className="text-gray-600 mb-1">
                                     <span className="font-medium">Transaction ID / Reference No:</span> {payment.transaction_id}
                                 </div>
                             )}
                             {payment.remarks && (
                                 <div className="text-gray-600">
                                     <span className="font-medium">Remarks:</span> {payment.remarks}
                                 </div>
                             )}
                         </div>
                     )}

                                         {/* Current proof image display */}
                     {payment.proof_image_url && (
                         <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
                             <div className="flex items-center justify-between mb-2">
                                 <span className="text-sm font-medium text-gray-700">Current Proof</span>
                                 <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => setShowImageDialog(true)}
                                     className="flex items-center gap-1 text-xs h-6 cursor-pointer"
                                 >
                                     <Eye className="h-3 w-3" />
                                     View
                                 </Button>
                             </div>
                             <img
                                 src={payment.proof_image_url}
                                 alt="Proof of Payment"
                                 className="w-full max-h-24 object-contain rounded border cursor-pointer"
                                 onClick={() => setShowImageDialog(true)}
                                 onError={(e) => {
                                     e.target.style.display = 'none';
                                 }}
                             />
                             {payment.proof_last_uploaded_at && (
                                 <div className="text-xs text-gray-500 mt-1">
                                     Uploaded: {payment.proof_last_uploaded_at}
                                 </div>
                             )}
                         </div>
                     )}

                    {/* Rejection reason if exists */}
                    {payment.proof_status === 'rejected' && payment.proof_rejected_reason && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Rejection reason:</strong> {payment.proof_rejected_reason}
                        </div>
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
                        <AlertDialogAction onClick={() => setShowUploadDialog(false)} className="cursor-pointer">
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
