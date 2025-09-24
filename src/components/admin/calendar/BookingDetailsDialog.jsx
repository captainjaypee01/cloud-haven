// components/admin/calendar/BookingDetailsDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/format';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import ProofImageDialog from '../booking/ProofImageDialog';
import AddPaymentDialog from '../booking/AddPaymentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Calendar, 
  Users, 
  DollarSign, 
  CreditCard, 
  Mail,
  Phone,
  Clock,
  Home,
  Notebook,
  Eye,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

const BookingDetailsDialog = ({ open, onOpenChange, bookingData, unitInfo, onBookingUpdate }) => {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
  const [statusProofDialog, setStatusProofDialog] = useState(false);
  const [selectedProofPayment, setSelectedProofPayment] = useState(null);
  const [proofAction, setProofAction] = useState(null); // 'accepted' or 'rejected'
  const [resetProofDialog, setResetProofDialog] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [currentBookingData, setCurrentBookingData] = useState(bookingData);
  const api = useApi();

  const statusForm = useForm({
    defaultValues: { reason: '' },
    resolver: (values) => {
      const errors = {};
      if (proofAction === 'rejected' && (!values.reason || values.reason.trim() === '')) {
        errors.reason = { type: 'required', message: 'Rejection reason is required' };
      }
      return { values, errors };
    }
  });

  const resetForm = useForm({
    defaultValues: { reason: '' }
  });

  // Define fetchPaymentsForBooking function before useEffect
  const fetchPaymentsForBooking = async (bookingId) => {
    if (!bookingId) return;
    
    setLoadingPayments(true);
    try {
      const response = await api.get(`${API_PREFIX}/admin/bookings/${bookingId}/payments`, {
        requiresAuth: true,
      });
      
      // Handle the API response structure: { success: true, data: [...] }
      const paymentsData = response.data?.success ? response.data.data : [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
      setPayments([]); // Set empty array on error
    } finally {
      setLoadingPayments(false);
    }
  };

  // Update currentBookingData when bookingData prop changes and fetch payments
  useEffect(() => {
    setCurrentBookingData(bookingData);
    // Clear payment data when booking changes to prevent showing old data
    setPayments([]);
    setLoadingPayments(false);
    setProcessingPayment(null);
    
    // Fetch payments for the new booking if dialog is open
    if (open && bookingData?.id) {
      fetchPaymentsForBooking(bookingData.id);
    }
  }, [bookingData, open]);

  if (!currentBookingData) return null;
  const {
    id: bookingId,
    reference_number,
    guest_name,
    guest_email,
    guest_phone,
    check_in_date,
    check_out_date,
    nights,
    adults,
    children,
    total_guests,
    room_price,
    meal_price,
    final_price,
    discount_amount,
    other_charges,
    total_paid,
    status,
    booking_type,
    special_requests
  } = currentBookingData;

  // Calculate total_payable and remaining_balance consistently with BookingDetailsContent
  const actualFinalPrice = Number(final_price) - Number(discount_amount || 0);
  const totalPayable = actualFinalPrice + Number(other_charges || 0);
  const remainingBalance = Math.max(totalPayable - Number(total_paid || 0), 0);

  const fetchBookingData = async () => {
    if (!currentBookingData?.id) return;
    
    try {
      const response = await api.get(`${API_PREFIX}/admin/bookings/${currentBookingData.id}`, {
        requiresAuth: true,
      });
      
      // Handle different possible response structures
      const bookingData = response.data?.data || response.data;
      
      if (bookingData) {
        setCurrentBookingData(bookingData);
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
      toast.error('Failed to refresh booking data');
    }
  };

  const fetchPayments = async () => {
    if (!currentBookingData?.id) return;
    await fetchPaymentsForBooking(currentBookingData.id);
  };

  const handleResetProofUploads = (payment) => {
    setSelectedProofPayment(payment);
    resetForm.reset({ reason: '' });
    setResetProofDialog(true);
  };

  const handleProofStatusAction = (payment, action) => {
    setSelectedProofPayment(payment);
    setProofAction(action);
    statusForm.reset({ reason: '' });
    setStatusProofDialog(true);
  };

  const confirmProofStatusUpdate = async (data) => {
    if (!selectedProofPayment || !proofAction) return;
    
    // Additional validation for rejection reason
    if (proofAction === 'rejected' && (!data.reason || data.reason.trim() === '')) {
      toast.error('Rejection reason is required');
      return; // Don't close dialog, don't proceed
    }
    
    setProcessingPayment(selectedProofPayment.id);
    try {
      await api.patch(
        `${API_PREFIX}/admin/payments/${selectedProofPayment.id}/proof-status`,
        { 
          status: proofAction,
          reason: proofAction === 'rejected' ? data.reason : undefined
        },
        { requiresAuth: true }
      );
      if (proofAction === 'rejected') {
        toast.success('Proof rejected, payment marked as failed, and booking cancelled successfully');
      } else {
        toast.success(`Proof ${proofAction} successfully`);
      }
      setStatusProofDialog(false);
      setSelectedProofPayment(null);
      setProofAction(null);
      
      // Update calendar if booking status changed (e.g., reject proof → booking cancelled)
      if (onBookingUpdate) {
        onBookingUpdate();
      }
      
      // Close the dialog to force fresh data reload when reopened
      onOpenChange(false);
      toast.success('Proof status updated successfully. Dialog closed to refresh data.');
    } catch (error) {
      console.error(`Error ${proofAction}ing payment proof:`, error);
      toast.error(`Failed to ${proofAction} proof`);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleViewProof = (payment) => {
    if (payment.proof_image_url || payment.proof_last_file_path) {
      setSelectedPaymentProof(payment);
      setShowProofDialog(true);
    } else {
      toast.error('No proof of payment available');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      downpayment: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getProofStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getProofStatusBadge = (proofStatus, uploadCount = 0) => {
    if (!proofStatus || proofStatus === 'none') {
      return <span className="text-xs text-gray-500">{uploadCount}/3</span>;
    }
    
    switch (proofStatus) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">Under Review ({uploadCount}/3)</Badge>;
      case 'accepted':
        return <Badge variant="success" className="text-xs">Accepted ({uploadCount}/3)</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Rejected ({uploadCount}/3)</Badge>;
      default:
        return <span className="text-xs text-gray-500">{uploadCount}/3</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Home className="h-5 w-5" />
            Booking Details - {unitInfo?.room_name} Unit {unitInfo?.unit_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Booking Status & Reference */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Badge className={getStatusColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {booking_type === 'day_tour' ? 'Day Tour' : 'Overnight Stay'}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-mono text-sm text-muted-foreground break-all">
                {reference_number}
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </h3>
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span>{guest_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="text-sm break-all">{guest_email}</span>
                </div>
                {guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Phone:</span>
                    <span>{guest_phone}</span>
                  </div>
                )}
                {special_requests && (
                  <div className="flex items-center gap-2">
                    <Notebook className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Special Requests:</span>
                    <span>{special_requests}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Adults:</span>
                  <span className="font-semibold">{adults}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Children:</span>
                  <span className="font-semibold">{children}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Total:</span>
                  <span className="font-bold text-base sm:text-lg">{total_guests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Stay Information
            </h3>
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Check-in:</span>
                  <span>{formatDate(check_in_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Check-out:</span>
                  <span>{formatDate(check_out_date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Duration:</span>
                <span className="font-bold text-lg">{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Information
            </h3>
            <div className="space-y-3 p-4 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Room Price:</span>
                  <span className="font-medium text-sm sm:text-base">{formatCurrency(room_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meal Price:</span>
                  <span className="font-medium text-sm sm:text-base">{formatCurrency(meal_price || 0)}</span>
                </div>
                {other_charges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Other Charges:</span>
                    <span className="font-medium text-sm sm:text-base">{formatCurrency(other_charges)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 pt-2 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm sm:text-base">Total Payable:</span>
                  <span className="font-bold text-base sm:text-lg">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Total Paid:</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">{formatCurrency(total_paid)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-200">
                  <span className="font-semibold text-red-600 text-sm sm:text-base">Remaining Balance:</span>
                  <span className="font-bold text-base sm:text-lg text-red-600">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Status
            </h3>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Status:</span>
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              {remainingBalance > 0 && (
                <div className="mt-2 text-sm text-amber-700">
                  <strong>Note:</strong> Remaining balance of {formatCurrency(remainingBalance)} is due at the resort during check-in.
                </div>
              )}
            </div>
          </div>

          {/* Payment Management - Show for all bookings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Management
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPayments}
                  disabled={loadingPayments}
                  className="cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPayments ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading payments...
                    </div>
                  ) : !Array.isArray(payments) || payments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No payment records found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Payment #{payment.id}</span>
                              <Badge className={getStatusColor(payment.status)}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                              {getProofStatusBadge(payment.proof_status, payment.proof_upload_count)}
                            </div>
                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <div>Date: {formatDate(payment.created_at)}</div>
                            {payment.payment_method && (
                              <div>Method: {payment.payment_method}</div>
                            )}
                            {payment.reference_number && (
                              <div>Reference: {payment.reference_number}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t">
                            {payment.proof_image_url || payment.proof_last_file_path ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProof(payment)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Proof
                              </Button>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No proof of payment uploaded yet
                              </div>
                            )}
                            
                            <div className="flex gap-1 ml-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditPayment(payment); setShowEditPayment(true); }}
                                className="cursor-pointer text-xs"
                              >
                                Edit
                              </Button>
                              
                              {payment.proof_status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleProofStatusAction(payment, 'accepted')}
                                    disabled={processingPayment === payment.id}
                                    className="cursor-pointer text-green-600 hover:text-green-700"
                                  >
                                    {processingPayment === payment.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleProofStatusAction(payment, 'rejected')}
                                    disabled={processingPayment === payment.id}
                                    className="cursor-pointer text-red-600 hover:text-red-700"
                                  >
                                    {processingPayment === payment.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
        
        {/* Footer with View Full Details button */}
        <div className="flex-shrink-0 border-t p-4 bg-gray-50">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => window.open(`/admin/bookings/${currentBookingData?.id}`, '_blank')}
              className="cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Proof Image Dialog */}
      <ProofImageDialog
        open={showProofDialog}
        onOpenChange={setShowProofDialog}
        imageUrl={selectedPaymentProof?.proof_image_url || selectedPaymentProof?.proof_last_file_path}
        paymentInfo={selectedPaymentProof}
      />

      {/* Proof Status Update Dialog */}
      <AlertDialog open={statusProofDialog} onOpenChange={setStatusProofDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {proofAction === 'accepted' ? 'Accept' : 'Reject'} Proof of Payment
            </AlertDialogTitle>
            <AlertDialogDescription>
              {proofAction === 'accepted' 
                ? 'Mark this proof of payment as accepted and verified.'
                : 'Reject this proof of payment. Please provide a reason for rejection. Note: Rejecting the proof will automatically cancel the booking.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...statusForm}>
            <form onSubmit={(e) => e.preventDefault()}>
              {proofAction === 'rejected' && (
                <>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Important Notice</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Rejecting this proof of payment will mark the payment as failed, automatically cancel the booking, 
                          and send both a proof rejection email and a booking cancellation email to the guest.
                        </p>
                      </div>
                    </div>
                  </div>
                  <FormField
                    control={statusForm.control}
                    name="reason"
                    rules={{ 
                      required: 'Rejection reason is required',
                      validate: (value) => value.trim() !== '' || 'Rejection reason cannot be empty'
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejection Reason *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter reason for rejecting this proof..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  type="button"
                  onClick={statusForm.handleSubmit(confirmProofStatusUpdate)}
                  className={`cursor-pointer ${proofAction === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {proofAction === 'accepted' ? 'Accept Proof' : 'Reject Proof'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Payment Dialog */}
      <AddPaymentDialog
        open={showEditPayment}
        onOpenChange={setShowEditPayment}
        bookingReferenceNumber={currentBookingData?.reference_number}
        onSuccess={() => {
          setEditPayment(null);
          
          // Update calendar if payment status changed (e.g., payment → paid)
          if (onBookingUpdate) {
            onBookingUpdate();
          }
          
          // Close the dialog to force fresh data reload when reopened
          onOpenChange(false);
          toast.success('Payment updated successfully. Dialog closed to refresh data.');
        }}
        payment={editPayment}
        isEdit={!!editPayment}
      />
    </Dialog>
  );
};

export default BookingDetailsDialog;
