// components/admin/BookingDetailsContent.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import AddPaymentDialog from './AddPaymentDialog';
import AddOtherChargeDialog from './AddOtherChargeDialog';
import RescheduleBookingDialog from './RescheduleBookingDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { X } from 'lucide-react'; // Icon for delete
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';

const BookingDetailsContent = ({ booking, fetchBooking }) => {
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [editPayment, setEditPayment] = useState(null);
    const [showAddOtherCharge, setShowAddOtherCharge] = useState(false);
    const [deleteOtherCharge, setDeleteOtherCharge] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const api = useApi();

    if (!booking) return <div className="p-6">Booking not found.</div>;

    // Total paid from payments with status 'paid'
    const totalPaid = booking.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    // Remaining balance = (final price + other charges) - total paid (never negative)
    const otherCharges = booking.other_charges || 0;
    const totalPayable = Number(booking.final_price) + Number(otherCharges);
    // Remaining balance = final price - total paid (never negative)
    const remainingBalance = Math.max(totalPayable - totalPaid, 0);

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
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">Booking #{booking.reference_number}</h2>
                    <StatusBadge status={booking.status} />
                </div>
                <div className="flex gap-2">
                    <Button
                        className="cursor-pointer"
                        variant="destructive"
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
                    </div>
                    <div>
                        <div><span className="font-semibold">Check-in:</span> {formatDate(booking.check_in_date)} </div>
                        <div><span className="font-semibold">Check-out:</span> {formatDate(booking.check_out_date)}</div>
                        <div><span className="font-semibold">Reserved Until:</span> {booking.reserved_until ? formatDateTime(booking.local_reserved_until) : '-'}</div>
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
                        <Button
                            size="sm"
                            className="cursor-pointer"
                            variant="secondary"
                            onClick={() => setShowAddOtherCharge(true)}
                        >
                            + Add Other Charge
                        </Button>
                    </div>
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
                            <span className="font-semibold">Discount:</span>
                            <span>-{formatCurrency(booking.discount_amount)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="font-semibold">Other Charges:</span>
                            <span>{formatCurrency(otherCharges)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t pt-2 font-bold text-base">
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

            {/* Rooms Table */}
            <Card>
                <CardContent className="p-6">
                    <div className="text-lg font-semibold mb-3">Rooms</div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b">
                                <tr>
                                    <th className="py-2 pr-4 font-medium">Room Name</th>
                                    <th className="py-2 pr-4 font-medium">Price/Night</th>
                                    <th className="py-2 pr-4 font-medium">Adults</th>
                                    <th className="py-2 pr-4 font-medium">Children</th>
                                    <th className="py-2 pr-4 font-medium">Total Guests</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.booking_rooms?.map((br, idx) => (
                                    <tr key={idx} className="border-b last:border-b-0">
                                        <td className="py-2 pr-4">{br.room?.name || ''}</td>
                                        <td className="py-2 pr-4">{formatCurrency(br.price_per_night)}</td>
                                        <td className="py-2 pr-4">{br.adults}</td>
                                        <td className="py-2 pr-4">{br.children}</td>
                                        <td className="py-2 pr-4">{br.total_guests}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

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
                                    <th className="py-2 pr-4 font-medium">Transaction ID</th>
                                    <th className="py-2 pr-4 font-medium">Error Code</th>
                                    <th className="py-2 pr-4 font-medium">Error Message</th>
                                    <th className="py-2 pr-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.payments?.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-3 text-center text-muted">No payments found.</td>
                                    </tr>
                                )}
                                {booking.payments?.map((p, idx) => (
                                    <tr key={idx} className="border-b last:border-b-0">
                                        <td className="py-2 pr-4">{formatDateTime(p.created_at)}</td>
                                        <td className="py-2 pr-4">{p.provider}</td>
                                        <td className="py-2 pr-4">{formatCurrency(p.amount)}</td>
                                        <td className="py-2 pr-4"><StatusBadge status={p.status} /></td>
                                        <td className="py-2 pr-4">{p.transaction_id || '-'}</td>
                                        <td className="py-2 pr-4">{p.error_code || '-'}</td>
                                        <td className="py-2 pr-4">{p.error_message || '-'}</td>
                                        <td className="py-2 pr-4 text-center">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="cursor-pointer"
                                                onClick={() => { setEditPayment(p); setShowAddPayment(true) }}
                                            >
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Add Manual Payment Button */}
                    <div className="mt-4 flex justify-end">
                        <Button
                            className="cursor-pointer"
                            onClick={() => setShowAddPayment(true)}
                        >
                            + Add Manual Payment
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
};

export default BookingDetailsContent;
