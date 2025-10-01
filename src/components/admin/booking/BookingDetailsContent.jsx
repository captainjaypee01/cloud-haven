// components/admin/BookingDetailsContent.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import AddPaymentDialog from './AddPaymentDialog';
import AddOtherChargeDialog from './AddOtherChargeDialog';
import RescheduleBookingDialog from './RescheduleBookingDialog';
import ProofImageDialog from './ProofImageDialog';
import BookingCancellationDialog from './BookingCancellationDialog';
import BookingDeletionDialog from './BookingDeletionDialog';
import ChangeRoomUnitDialog from './ChangeRoomUnitDialog';
import PwdSeniorDiscountDialog from './PwdSeniorDiscountDialog';
import BookingPrintButton from './BookingPrintButton';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { X, RotateCcw, Check, XCircle, AlertTriangle, Calendar, Trash2, Edit3 } from 'lucide-react'; // Icon for delete
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import MealDetailComponent from '@/components/booking/MealDetailComponent';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPaymentProviderLabel } from '@/utils/paymentUtils';
import { useAppContext } from '@/context/AppContext';

const BookingDetailsContent = ({ booking, fetchBooking }) => {
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [editPayment, setEditPayment] = useState(null);
    const [showAddOtherCharge, setShowAddOtherCharge] = useState(false);
    const [deleteOtherCharge, setDeleteOtherCharge] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [showProofDialog, setShowProofDialog] = useState(false);
    const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
    const [resetProofDialog, setResetProofDialog] = useState(false);
    const [statusProofDialog, setStatusProofDialog] = useState(false);
    const [selectedProofPayment, setSelectedProofPayment] = useState(null);
    const [showCancellation, setShowCancellation] = useState(false);
    const [showDeletion, setShowDeletion] = useState(false);
    const [showChangeRoomUnit, setShowChangeRoomUnit] = useState(false);
    const [selectedBookingRoom, setSelectedBookingRoom] = useState(null);
    const [proofAction, setProofAction] = useState(null); // 'accept' or 'reject'
    const [showPwdSeniorDiscount, setShowPwdSeniorDiscount] = useState(false);
    const api = useApi();
    const navigate = useNavigate();
    const { userRole } = useAppContext();

    // Permission checks
    const canCancel = ['admin', 'superadmin'].includes(userRole);
    const canDelete = userRole === 'superadmin';
    const canAddPayments = ['staff', 'admin', 'superadmin'].includes(userRole);
    const canAddCharges = ['staff', 'admin', 'superadmin'].includes(userRole);

    const resetForm = useForm({
        defaultValues: { reason: '' }
    });

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

    if (!booking) return <div className="p-6">Booking not found.</div>;

    // Total paid from payments with status 'paid'
    const totalPaid = booking.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    // Calculate actual final price after discount and PWD/Senior discount
    const actualFinalPrice = Number(booking.final_price) - Number(booking.discount_amount || 0) - Number(booking.pwd_senior_discount || 0);
    // Remaining balance = (actual final price + other charges) - total paid (never negative)
    const otherCharges = booking.other_charges || 0;
    const totalPayable = actualFinalPrice + Number(otherCharges);
    // Remaining balance = actual final price - total paid (never negative)
    const remainingBalance = Math.max(totalPayable - totalPaid, 0);

    const handleViewProof = (payment) => {
        setSelectedPaymentProof(payment);
        setShowProofDialog(true);
    };

    const handleDeleteOtherChargePrompt = (charge) => {
        setDeleteOtherCharge(charge);
        setDeleteDialogOpen(true);
    };
    // Delete other charge function (uses AlertDialog)
    const handleConfirmDeleteOtherCharge = async () => {
        if (!deleteOtherCharge) return;
        await api.delete(`${API_PREFIX}/admin/bookings/${booking.id}/other-charges/${deleteOtherCharge.id}`, { requiresAuth: true });
        setDeleteOtherCharge(null);
        if (fetchBooking) fetchBooking();
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

    const confirmResetProofUploads = async (data) => {
        if (!selectedProofPayment) return;
        
        try {
            await api.patch(
                `${API_PREFIX}/admin/payments/${selectedProofPayment.id}/proof-upload/reset`,
                { reason: data.reason },
                { requiresAuth: true }
            );
            toast.success('Proof uploads reset successfully');
            setResetProofDialog(false);
            setSelectedProofPayment(null);
            if (fetchBooking) fetchBooking();
        } catch (error) {
            toast.error('Failed to reset proof uploads');
        }
    };

    const confirmProofStatusUpdate = async (data) => {
        if (!selectedProofPayment || !proofAction) return;
        
        // Additional validation for rejection reason
        if (proofAction === 'rejected' && (!data.reason || data.reason.trim() === '')) {
            toast.error('Rejection reason is required');
            return; // Don't close dialog, don't proceed
        }
        
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
            if (fetchBooking) fetchBooking();
        } catch (error) {
            toast.error(`Failed to ${proofAction} proof`);
        }
    };

    const handleCancellationSuccess = () => {
        if (fetchBooking) fetchBooking();
        setShowCancellation(false);
    };

    const handleDeletionSuccess = () => {
        // After successful deletion, redirect to booking list since the booking no longer exists
        navigate('/admin/bookings');
        setShowDeletion(false);
    };

    const handleChangeRoomUnit = (bookingRoom) => {
        setSelectedBookingRoom(bookingRoom);
        setShowChangeRoomUnit(true);
    };

    const handleRoomUnitChangeSuccess = () => {
        setShowChangeRoomUnit(false);
        setSelectedBookingRoom(null);
        if (fetchBooking) fetchBooking();
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
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Remaining Balance & Total Paid */}
            <div className="mb-4 flex gap-8">
                <div>
                    <span className="font-bold text-base">Total Paid: </span>
                    <span className="text-green-700 font-semibold">{formatCurrency(totalPaid)}</span>
                </div>
                <div>
                    <span className="font-bold text-base">Remaining Balance: </span>
                    <span className="text-red-700 font-semibold">{formatCurrency(remainingBalance)}</span>
                </div>
            </div>

            {/* Header & Actions */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 flex-wrap">
                                {booking.booking_type === 'day_tour' && (
                                    <Badge variant="secondary" className="w-fit">Day Tour</Badge>
                                )}
                                <Badge 
                                    variant={booking.booking_source === 'walkin' ? 'default' : 'outline'}
                                    className={`w-fit ${
                                        booking.booking_source === 'walkin' 
                                            ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                            : 'bg-purple-100 text-purple-800 border-purple-200'
                                    }`}
                                >
                                    {booking.booking_source === 'walkin' ? 'Walk-in' : 'Online'}
                                </Badge>
                            </div>
                            <h2 className="text-2xl font-bold">
                                Booking #{booking.reference_number}
                            </h2>
                        </div>
                        <StatusBadge status={booking.status} />
                    </div>
                <div className="flex flex-wrap gap-2">
                    {/* Print Receipt Button */}
                    <BookingPrintButton 
                        booking={booking}
                        className="cursor-pointer"
                        variant="outline"
                    />
                    {/* Calendar View Button */}
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => navigate(`/admin/bookings/calendar?date=${booking.check_in_date}`)}
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Calendar View</span>
                        <span className="sm:hidden">Calendar</span>
                    </Button>
                    {/* Cancellation Button - Only show if user can cancel and booking can be cancelled */}
                    {canCancel && ['pending', 'failed'].includes(booking.status) && (
                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            onClick={() => setShowCancellation(true)}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Cancel Booking</span>
                            <span className="sm:hidden">Cancel</span>
                        </Button>
                    )}
                    {/* Delete Button - Show only for superadmin */}
                    {canDelete && (
                        <Button
                            className="cursor-pointer"
                            variant="destructive"
                            onClick={() => setShowDeletion(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Delete Booking</span>
                            <span className="sm:hidden">Delete</span>
                        </Button>
                    )}
                    <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() => setShowReschedule(true)}
                    >
                        Reschedule
                    </Button>
                </div>
            </div>

            {/* Overview */}
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div><span className="font-semibold">Guest:</span> {booking.guest_name}</div>
                        <div><span className="font-semibold">Email:</span> {booking.guest_email}</div>
                        <div><span className="font-semibold">Phone:</span> {booking.guest_phone}</div>
                        <div><span className="font-semibold">Adults:</span> {booking.adults} &nbsp;&nbsp;<span className="font-semibold">Children:</span> {booking.children}</div>
                        <div><span className="font-semibold">Total Guests:</span> {booking.total_guests}</div>
                        <div><span className="font-semibold">Special Requests:</span> {booking.special_requests || '-'}</div>
                        <div><span className="font-semibold">User ID:</span> {booking.user_id || '-'}</div>
                        <div><span className="font-semibold">Booking Source:</span> 
                            <Badge 
                                variant={booking.booking_source === 'walkin' ? 'default' : 'outline'}
                                className={`ml-2 ${
                                    booking.booking_source === 'walkin' 
                                        ? 'bg-orange-100 text-orange-800 border-orange-200' 
                                        : 'bg-purple-100 text-purple-800 border-purple-200'
                                }`}
                            >
                                {booking.booking_source === 'walkin' ? 'Walk-in' : 'Online'}
                            </Badge>
                        </div>
                        <div><span className="font-semibold">Promo Used:</span> {booking.promo ? (
                            <span className="ml-1">
                                <Badge variant="secondary" className="mr-1">
                                    {booking.promo.code}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                    {booking.promo.discount_type === 'percentage' 
                                        ? `${booking.promo.discount_value}% off` 
                                        : `${formatCurrency(booking.promo.discount_value)} off`
                                    }
                                </span>
                            </span>
                        ) : '-'}</div>
                        <div><span className="font-semibold">Booked At:</span> {formatDateTime(booking.local_created_at)}</div>
                    </div>
                    <div>
                        {booking.booking_type === 'day_tour' ? (
                            <>
                                <div><span className="font-semibold">Day Tour Date:</span> {formatDate(booking.check_in_date)}</div>
                                <div><span className="font-semibold">Tour Hours:</span> 8:00 AM - 5:00 PM</div>
                                <div><span className="font-semibold">Reserved Until:</span> {booking.local_reserved_until ? formatDateTime(booking.local_reserved_until) : '-'}</div>
                            </>
                        ) : (
                            <>
                                <div><span className="font-semibold">Check-in:</span> {formatDate(booking.check_in_date)}</div>
                                <div><span className="font-semibold">Check-out:</span> {formatDate(booking.check_out_date)}</div>
                                <div><span className="font-semibold">Reserved Until:</span> {booking.local_reserved_until ? formatDateTime(booking.local_reserved_until) : '-'}</div>
                            </>
                        )}
                        <div><span className="font-semibold">Payment Option:</span> {booking.payment_option?.toUpperCase() || '-'}</div>
                        <div><span className="font-semibold">Downpayment Amount:</span> {formatCurrency(booking.downpayment_amount)}</div>
                        <div><span className="font-semibold">Downpayment At:</span> {booking.local_downpayment_at ? formatDateTime(booking.local_downpayment_at) : '-'}</div>
                        <div><span className="font-semibold">Paid At:</span> {booking.paid_at ? formatDateTime(booking.local_paid_at) : '-'}</div>
                        <div><span className="font-semibold">Failed Payment Attempts:</span> {booking.failed_payment_attempts}</div>
                        <div><span className="font-semibold">Last Payment Failed At:</span> {booking.last_payment_failed_at ? formatDateTime(booking.last_payment_failed_at) : '-'}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Section */}
            {/* Price Breakdown Section (improved layout) */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-semibold">Price Breakdown</div>
                        {canAddCharges && (
                            <Button
                                size="sm"
                                className="cursor-pointer"
                                variant="secondary"
                                onClick={() => setShowAddOtherCharge(true)}
                            >
                                + Add Other Charge
                            </Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex justify-between py-2">
                                <span className="font-semibold">Room Price:</span>
                                <span>{formatCurrency(booking.total_price)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-semibold">Meal Price:</span>
                                <span>{formatCurrency(booking.meal_price || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-semibold">Extra Guest Fee:</span>
                                <span>{formatCurrency(booking.extra_guest_fee || 0)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="font-semibold">Discount:</span>
                                <span className="text-red-600 font-medium">-{formatCurrency(booking.discount_amount)}</span>
                            </div>
                            {booking.promo && (
                                <div className="flex justify-between py-2 text-sm text-gray-600">
                                    <span>Promo: {booking.promo.code} ({booking.promo.discount_type === 'percentage' ? `${booking.promo.discount_value}%` : formatCurrency(booking.promo.discount_value)})</span>
                                    <span className="text-xs">{booking.promo.title}</span>
                                </div>
                            )}
                            {(booking.pwd_senior_discount || 0) > 0 && (
                                <div className="flex justify-between py-2">
                                    <span className="font-semibold">PWD/Senior Discount:</span>
                                    <span className="text-red-600 font-medium">-{formatCurrency(booking.pwd_senior_discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2">
                                <span className="font-semibold">Other Charges:</span>
                                <span>{formatCurrency(otherCharges)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-gray-300 pt-3 font-bold text-lg">
                            <span>Total Payable:</span>
                            <span>{formatCurrency(totalPayable)}</span>
                        </div>
                    </div>
                    {/* List all individual other charges with remarks and delete action: */}
                    {booking.other_charges_list && Array.isArray(booking.other_charges_list) && booking.other_charges_list.length > 0 && (
                        <div className="mt-3">
                            <div className="font-medium mb-1">Other Charges Details:</div>
                            <ul className="list-disc ml-6 space-y-1 text-sm">
                                {booking.other_charges_list.map((c, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="font-semibold">{formatCurrency(c.amount)}</span>
                                        {c.remarks ? ` – ${c.remarks}` : ''}
                                        <span className="ml-2 text-gray-400">{formatDateTime(c.created_at)}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="ml-2 cursor-pointer text-destructive"
                                            title="Delete charge"
                                            onClick={() => handleDeleteOtherChargePrompt(c)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <AddOtherChargeDialog
                        open={showAddOtherCharge}
                        onOpenChange={setShowAddOtherCharge}
                        bookingId={booking.id}
                        onSuccess={() => fetchBooking && fetchBooking()}
                    />
                </CardContent>
            </Card>

            {/* PWD/Senior Discount Management */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-semibold">PWD/Senior Discount</div>
                        {canAddCharges && (
                            <Button
                                size="sm"
                                className="cursor-pointer"
                                variant="secondary"
                                onClick={() => setShowPwdSeniorDiscount(true)}
                            >
                                {booking.pwd_senior_discount > 0 ? 'Edit Discount' : 'Add Discount'}
                            </Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2">
                            <span className="font-semibold">PWD/Senior Discount Amount:</span>
                            <span className={booking.pwd_senior_discount > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                                {booking.pwd_senior_discount > 0 ? `-${formatCurrency(booking.pwd_senior_discount)}` : 'No discount applied'}
                            </span>
                        </div>
                        {booking.pwd_senior_discount > 0 && (
                            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                <strong>Note:</strong> This discount is applied in addition to any promo discounts and reduces the total payable amount.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Rooms Table */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-lg font-semibold mb-3">Rooms</div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="py-2 pr-4 font-medium">Room Name</th>
                                    <th className="py-2 pr-4 font-medium">Room Unit</th>
                                    <th className="py-2 pr-4 font-medium">{booking.booking_type === 'day_tour' ? 'Price/Person' : 'Price/Night'}</th>
                                    <th className="py-2 pr-4 font-medium">Adults</th>
                                    <th className="py-2 pr-4 font-medium">Children</th>
                                    <th className="py-2 pr-4 font-medium">Total Guests</th>
                                    {booking.booking_type === 'day_tour' && (
                                        <>
                                            <th className="py-2 pr-4 font-medium">Base Price</th>
                                            <th className="py-2 pr-4 font-medium">Meal Cost</th>
                                            <th className="py-2 pr-4 font-medium">Total Price</th>
                                        </>
                                    )}
                                    <th className="py-2 pr-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.booking_rooms?.map((br, idx) => (
                                    <tr key={idx} className="border-b last:border-b-0">
                                        <td className="py-2 pr-4">{br.room?.name || ''}</td>
                                        <td className="py-2 pr-4">
                                            {br.room_unit ? (
                                                <span className="font-medium text-blue-600">
                                                    {br.room_unit.unit_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 italic">TBD</span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {booking.booking_type === 'day_tour' ? 
                                                formatCurrency((br.base_price || 0) / (br.total_guests || 1)) :
                                                formatCurrency(br.price_per_night)
                                            }
                                        </td>
                                        <td className="py-2 pr-4">{br.adults}</td>
                                        <td className="py-2 pr-4">{br.children}</td>
                                        <td className="py-2 pr-4">{br.total_guests}</td>
                                        {booking.booking_type === 'day_tour' && (
                                            <>
                                                <td className="py-2 pr-4">{formatCurrency(br.base_price || 0)}</td>
                                                <td className="py-2 pr-4">
                                                    <div className="text-xs space-y-1">
                                                        {br.include_lunch && (
                                                            <div className="text-green-600 flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                Lunch: {formatCurrency(br.lunch_cost || 0)}
                                                            </div>
                                                        )}
                                                        {br.include_pm_snack && (
                                                            <div className="text-green-600 flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                PM Snack: {formatCurrency(br.pm_snack_cost || 0)}
                                                            </div>
                                                        )}
                                                        {br.include_dinner && (
                                                            <div className="text-green-600 flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                Dinner: {formatCurrency(br.dinner_cost || 0)}
                                                            </div>
                                                        )}
                                                        {!br.include_lunch && !br.include_pm_snack && !br.include_dinner && (
                                                            <span className="text-gray-500 italic">No meals selected</span>
                                                        )}
                                                        {(br.include_lunch || br.include_pm_snack || br.include_dinner) && (
                                                            <div className="pt-1 border-t border-gray-200 font-medium text-gray-700">
                                                                Total: {formatCurrency(br.meal_cost || 0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-4 font-medium">{formatCurrency(br.total_price || 0)}</td>
                                            </>
                                        )}
                                        <td className="py-2 pr-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={() => handleChangeRoomUnit(br)}
                                                title="Change room unit"
                                            >
                                                <Edit3 className="h-3 w-3 mr-1" />
                                                Change Unit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Meal Breakdown Section */}
            {booking.booking_type === 'day_tour' ? (
                // Day Tour Meal Breakdown - Only show if we have meal data
                booking.meal_quote_data?.selections && (
                    <MealDetailComponent 
                        mealQuoteData={booking.meal_quote_data}
                        title="Day Tour Meal Breakdown"
                        showTitle={true}
                    />
                )
            ) : (
                // Overnight Meal Breakdown - Show if we have data, otherwise show simple summary
                <Card>
                    <CardContent className="p-6">
                        <div className="text-lg font-semibold mb-3">Overnight Meal Information</div>
                        <div className="space-y-4">
                            {booking.meal_quote_data?.nights ? (
                                // We have detailed meal data (newer bookings)
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {booking.meal_quote_data.buffet_nights || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Buffet Nights</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {booking.meal_quote_data.free_breakfast_nights || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Free Breakfast Nights</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {booking.extra_guest_count || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Extra Guests</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {formatCurrency(booking.meal_price || 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Meal Cost</div>
                                        </div>
                                    </div>

                                    {/* Daily Breakdown */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left text-sm">
                                            <thead className="border-b">
                                                <tr>
                                                    <th className="py-2 pr-4 font-medium">Date</th>
                                                    <th className="py-2 pr-4 font-medium">Meal Type</th>
                                                    <th className="py-2 pr-4 font-medium">Guest Breakdown</th>
                                                    <th className="py-2 pr-4 font-medium">Pricing</th>
                                                    <th className="py-2 pr-4 font-medium">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {booking.meal_quote_data.nights.map((night, idx) => {
                                                    // Calculate extra guests for this room
                                                    const roomMaxGuests = booking.booking_rooms?.[0]?.room?.max_guests || 6;
                                                    const totalGuests = booking.total_guests;
                                                    const extraGuests = Math.max(0, totalGuests - roomMaxGuests);
                                                    
                                                    return (
                                                        <tr key={idx} className="border-b last:border-b-0">
                                                            <td className="py-2 pr-4">{formatDate(night.date)}</td>
                                                            <td className="py-2 pr-4">
                                                                <Badge 
                                                                    variant={night.type === 'buffet' ? 'default' : 'secondary'}
                                                                    className={night.type === 'buffet' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                                                >
                                                                    {night.type === 'buffet' ? 'Buffet' : 'Free Breakfast'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2 pr-4">
                                                                <div className="space-y-1">
                                                                    <div className="text-xs">
                                                                        <span className="font-medium">{totalGuests} Total Guests</span>
                                                                    </div>
                                                                    {night.type === 'buffet' ? (
                                                                        <div className="text-xs text-gray-600">
                                                                            <div>• All guests pay buffet price</div>
                                                                            {extraGuests > 0 && (
                                                                                <div>• {extraGuests} extra guests: Additional entrance/amenity fee</div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-gray-600">
                                                                            <div>• {roomMaxGuests} guests: Free breakfast + amenities</div>
                                                                            {extraGuests > 0 && (
                                                                                <div>• {extraGuests} extra guests: All-inclusive fee (breakfast + entrance + amenities)</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-2 pr-4">
                                                                {night.type === 'buffet' ? (
                                                                    <div className="text-xs">
                                                                        <div>Buffet - Adult: {formatCurrency(night.adult_price || 0)}</div>
                                                                        <div>Buffet - Child: {formatCurrency(night.child_price || 0)}</div>
                                                                        {extraGuests > 0 && (
                                                                            <div className="text-orange-600">Extra guest fee: {formatCurrency(night.extra_guest_fee || 0)}</div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs">
                                                                        <div>Free breakfast: {roomMaxGuests} guests</div>
                                                                        {extraGuests > 0 && (
                                                                            <div className="text-orange-600">All-inclusive fee: {formatCurrency(night.extra_guest_fee || 0)}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-2 pr-4 font-medium">
                                                                {night.type === 'buffet' ? (
                                                                    <div className="text-xs">
                                                                        <div>Buffet: {formatCurrency((booking.adults * (night.adult_price || 0)) + (booking.children * (night.child_price || 0)))}</div>
                                                                        {extraGuests > 0 && (
                                                                            <div className="text-orange-600">Extra fee: {formatCurrency(extraGuests * (night.extra_guest_fee || 0))}</div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs">
                                                                        <div className="text-green-600">Free: {formatCurrency(0)}</div>
                                                                        {extraGuests > 0 && (
                                                                            <div className="text-orange-600">All-inclusive: {formatCurrency(extraGuests * (night.extra_guest_fee || 0))}</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        
                                        {/* Extra Guest Fee Summary */}
                                        {booking.extra_guest_fee > 0 && (
                                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium text-orange-800">Extra Guest Fees (Buffet Days)</div>
                                                        <div className="text-sm text-orange-600">
                                                            {booking.extra_guest_count} extra guest{booking.extra_guest_count > 1 ? 's' : ''} - entrance fee, amenities, and additional services
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-orange-800">
                                                        {formatCurrency(booking.extra_guest_fee)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                // Legacy overnight booking - simple summary
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-800 mb-2">
                                        <strong>Legacy Booking:</strong> Meals calculated based on meal program settings at time of booking
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="font-medium text-blue-900">Meal Information:</div>
                                            <div className="text-sm text-blue-700">
                                                • Meals calculated using meal program pricing<br/>
                                                • Based on booking dates and guest count<br/>
                                                • Check meal program settings for details
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-blue-900">Total Meal Cost:</div>
                                            <div className="text-xl font-bold text-blue-600">
                                                {formatCurrency(booking.meal_price || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payments Table */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-lg font-semibold mb-3">Payments</div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="py-2 pr-4 font-medium">Date</th>
                                    <th className="py-2 pr-4 font-medium">Provider</th>
                                    <th className="py-2 pr-4 font-medium">Amount</th>
                                    <th className="py-2 pr-4 font-medium">Status</th>
                                    <th className="py-2 pr-4 font-medium">Downpayment Status</th>
                                    <th className="py-2 pr-4 font-medium">Transaction ID</th>
                                    <th className="py-2 pr-4 font-medium">Error Code</th>
                                    <th className="py-2 pr-4 font-medium">Error Message</th>
                                    <th className="py-2 pr-4 font-medium">Proof Status</th>
                                    <th className="py-2 pr-4 font-medium">Proof File</th>
                                    <th className="py-2 pr-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.payments?.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-3 text-center text-muted">No payments found.</td>
                                    </tr>
                                )}
                                {booking.payments?.map((p, idx) => (
                                    <tr key={idx} className="border-b last:border-b-0">
                                        <td className="py-2 pr-4">{formatDateTime(p.created_at)}</td>
                                        <td className="py-2 pr-4">{getPaymentProviderLabel(p.provider)}</td>
                                        <td className="py-2 pr-4">{formatCurrency(p.amount)}</td>
                                        <td className="py-2 pr-4"><StatusBadge status={p.status} /></td>
                                        <td className="py-2 pr-4">
                                            {p.downpayment_status === 'downpayment' ? (
                                                <Badge variant="warning" className="text-xs">Downpayment</Badge>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="py-2 pr-4">{p.transaction_id || '-'}</td>
                                        <td className="py-2 pr-4">{p.error_code || '-'}</td>
                                        <td className="py-2 pr-4">{p.error_message || '-'}</td>
                                        <td className="py-2 pr-4">
                                            {getProofStatusBadge(p.proof_status, p.proof_upload_count)}
                                            {p.proof_rejected_reason && (
                                                <div className="text-xs text-red-600 mt-1" title={p.proof_rejected_reason}>
                                                    Reason: {p.proof_rejected_reason.length > 30 ? 
                                                        `${p.proof_rejected_reason.substring(0, 30)}...` : 
                                                        p.proof_rejected_reason
                                                    }
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {p.proof_last_file_path || p.proof_image_url ? (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => handleViewProof(p)}
                                                    className="text-cyan-700 p-0 h-auto cursor-pointer"
                                                >
                                                    View
                                                </Button>
                                            ) : (
                                                '-' 
                                            )}
                                        </td>
                                        <td className="py-2 pr-4 text-center">
                                            <div className="flex flex-col gap-1">
                                                {canAddPayments && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="cursor-pointer text-xs"
                                                        onClick={() => { setEditPayment(p); setShowAddPayment(true) }}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                
                                                {/* Proof management buttons */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="cursor-pointer text-xs"
                                                    onClick={() => handleResetProofUploads(p)}
                                                    title="Reset proof uploads"
                                                >
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                    Reset
                                                </Button>
                                                
                                                {p.proof_status === 'pending' && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="cursor-pointer text-xs text-green-600 hover:text-green-700"
                                                            onClick={() => handleProofStatusAction(p, 'accepted')}
                                                            title="Accept proof"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="cursor-pointer text-xs text-red-600 hover:text-red-700"
                                                            onClick={() => handleProofStatusAction(p, 'rejected')}
                                                            title="Reject proof"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Add Manual Payment Button */}
                    {canAddPayments && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                className="cursor-pointer"
                                onClick={() => {
                                    setEditPayment(null);
                                    setShowAddPayment(true);
                                }}
                            >
                                + Add Manual Payment
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cancellation Information (if cancelled) */}
            {booking.status === 'cancelled' && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-6">
                        <div className="text-lg font-semibold mb-3 text-destructive flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Cancellation Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div><span className="font-semibold">Cancelled At:</span> {booking.cancelled_at ? formatDateTime(booking.local_cancelled_at || booking.cancelled_at) : '-'}</div>
                                <div><span className="font-semibold">Cancelled By:</span> {booking.cancelled_by_name || (booking.cancelled_by ? 'Admin Staff' : 'System')}</div>
                            </div>
                            {booking.cancellation_reason && (
                                <div>
                                    <div><span className="font-semibold">Reason:</span></div>
                                    <div className="text-sm bg-muted p-3 rounded-md mt-1">
                                        {booking.cancellation_reason}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audit & Timestamps */}
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div><span className="font-semibold">Created At:</span> {formatDateTime(booking.local_created_at)}</div>
                        <div><span className="font-semibold">Updated At:</span> {formatDateTime(booking.local_updated_at)}</div>
                    </div>
                </CardContent>
            </Card>

            <AddPaymentDialog
                open={showAddPayment}
                onOpenChange={setShowAddPayment}
                bookingReferenceNumber={booking.reference_number}
                onSuccess={() => {
                    setEditPayment(null);
                    fetchBooking && fetchBooking();
                }}
                payment={editPayment}
                isEdit={!!editPayment}
                booking={booking}
            />
            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDeleteOtherCharge}
                title="Delete Other Charge"
                description={`Are you sure you want to delete this charge${deleteOtherCharge ? ` (₱${formatCurrency(deleteOtherCharge.amount)}${deleteOtherCharge.remarks ? `, ${deleteOtherCharge.remarks}` : ''})` : ''}? This action cannot be undone.`}
            />
            <RescheduleBookingDialog
                open={showReschedule}
                onOpenChange={setShowReschedule}
                booking={booking}
                onSuccess={() => {
                    setShowReschedule(false);
                    fetchBooking && fetchBooking();
                }}
            />
            <ProofImageDialog
                open={showProofDialog}
                onOpenChange={setShowProofDialog}
                imageUrl={selectedPaymentProof?.proof_image_url || selectedPaymentProof?.proof_last_file_path}
                paymentInfo={selectedPaymentProof}
            />
            {/* Only render cancellation dialog if user has permission */}
            {canCancel && (
                <BookingCancellationDialog
                    open={showCancellation}
                    onOpenChange={setShowCancellation}
                    booking={booking}
                    onSuccess={handleCancellationSuccess}
                />
            )}
            {/* Only render deletion dialog if user is superadmin */}
            {canDelete && (
                <BookingDeletionDialog
                    open={showDeletion}
                    onOpenChange={setShowDeletion}
                    booking={booking}
                    onSuccess={handleDeletionSuccess}
                />
            )}

            {/* Reset Proof Uploads Dialog */}
            <AlertDialog open={resetProofDialog} onOpenChange={setResetProofDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Proof Uploads</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the proof upload count to 0/3 for this payment, allowing the guest to upload new proof files. 
                            If there's a pending proof, it will be marked as rejected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(confirmResetProofUploads)}>
                            <FormField
                                control={resetForm.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Enter reason for resetting proof uploads..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction type="submit" className="cursor-pointer">
                                    Reset Upload Count
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>

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

            {/* Change Room Unit Dialog */}
            <ChangeRoomUnitDialog
                open={showChangeRoomUnit}
                onOpenChange={setShowChangeRoomUnit}
                booking={booking}
                bookingRoom={selectedBookingRoom}
                onSuccess={handleRoomUnitChangeSuccess}
            />

            {/* PWD/Senior Discount Dialog */}
            <PwdSeniorDiscountDialog
                open={showPwdSeniorDiscount}
                onOpenChange={setShowPwdSeniorDiscount}
                booking={booking}
                onSuccess={() => {
                    setShowPwdSeniorDiscount(false);
                    if (fetchBooking) fetchBooking();
                }}
            />
        </div>
    );
};

export default BookingDetailsContent;
