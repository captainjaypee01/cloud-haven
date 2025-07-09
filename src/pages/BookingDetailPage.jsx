import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "../utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLoader } from "@/context/LoaderContext";
import { API_PREFIX } from "@/constants/api";
import SeaWaveBg from "@/components/common/SeaWaveBg";
import { BadgeAlertIcon, BadgeCheckIcon } from "lucide-react";

const statusColor = status => {
    switch (status) {
        case "paid": return "success";
        case "downpayment": return "warning";
        case "pending": return "secondary";
        case "completed": return "primary";
        case "cancelled":
        case "expired": return "destructive";
        default: return "outline";
    }
};

const UnifiedBookingResultPage = () => {
    const { refNo } = useParams();
    const api = useApi();
    const navigate = useNavigate();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [lastPaymentError, setLastPaymentError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            show();
            try {
                const res = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`);
                const data = res.data?.data || res.data?.booking || res.data;
                setBooking(data);
                if (data?.last_payment_failed) setLastPaymentError(data.last_payment_failed_message || "Payment attempt failed. Please try again.");
            } catch (err) {
                navigate("/");
            } finally {
                hide();
            }
        };
        fetchBooking();
    }, [refNo]);
    const getPaidAmount = (payments = []) => {
        return payments
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }
    if (!booking) return null;
    const paidAmount = getPaidAmount(booking.payments || []);
    const remainingBalance = Math.max(0, (booking.final_price || 0) - paidAmount);
    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <SeaWaveBg />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-20">
                {/* Error banner */}
                {lastPaymentError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        <b>Payment Error:</b> {lastPaymentError}
                    </div>
                )}
                {/* Badge + ref # + status */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge variant={statusColor(booking.status)} className="text-base px-3 py-1 capitalize">
                        {booking.status === 'completed' ? 'Completed (Checked Out)' : booking.status.replace("_", " ")}
                    </Badge>
                </div>
                <div className="mb-3">
                    <div className="text-sm text-gray-500">Reference No:</div>
                    <div className="font-bold text-cyan-700 text-lg">{booking.reference_number}</div>
                </div>
                {/* Booking summary grid just like PaymentPage */}
                <div className="mb-4 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between"><span>Guest</span><span>{booking.guest_name}</span></div>
                    <div className="flex justify-between"><span>Check-in</span><span>{booking.check_in_date}</span></div>
                    <div className="flex justify-between"><span>Check-out</span><span>{booking.check_out_date}</span></div>
                    <div className="flex justify-between"><span>Total guests</span><span>{booking.total_guests}</span></div>
                    <div className="flex justify-between"><span>Adults</span><span>{booking.adults}</span></div>
                    <div className="flex justify-between"><span>Children</span><span>{booking.children}</span></div>
                    <div className="flex justify-between font-medium text-base mt-2"><span>Total</span><span>{formatCurrency(booking.final_price)}</span></div>
                </div>
                <div className="mb-4">
                    <b>Rooms:</b>
                    <ul className="list-disc ml-6 mt-1 text-sm">
                        {(booking.booking_rooms || []).map((room, idx) => (
                            <li key={room.id || idx}>
                                {room.room_name || room.room?.name || "Room"} — {room.adults} Adults, {room.children} Children
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Payment History */}
                <div className="mt-8 mb-4">
                    <h3 className="font-semibold text-lg mb-2">Payment History</h3>
                    <div className="rounded bg-gray-50 border border-gray-200 p-3">
                        {(!booking.payments || booking.payments.length === 0) ? (
                            <div className="text-gray-500 text-sm">No payments yet.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="text-left py-1 px-2">Date</th>
                                        <th className="text-left py-1 px-2">Amount</th>
                                        <th className="text-left py-1 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {booking.payments.map((payment, i) => (
                                        <tr key={payment.id || i}>
                                            <td className="py-1 px-2">{payment.paid_at}</td>
                                            <td className="py-1 px-2">{formatCurrency(payment.amount)}</td>
                                            <td className="py-1 px-2">
                                                <Badge variant={payment.status === "paid" ? "success" : (payment.status === "failed" ? "destructive" : "secondary")}>{payment.status === "paid" ? <BadgeCheckIcon /> : <BadgeAlertIcon />} {payment.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                {/* Status-specific UI and actions */}
                {booking.status === "pending" && (
                    <div className="my-5">
                        <div className="mb-2 text-yellow-700 font-medium">Payment required to confirm your booking.</div>
                        <Link to={`/booking/${refNo}/payment`}>
                            <Button size="lg" className="w-full cursor-pointer">Proceed to Payment</Button>
                        </Link>
                    </div>
                )}
                {booking.status === "downpayment" && (
                    <div className="my-5">
                        <div className="mb-2 text-yellow-700">Downpayment paid. Remaining balance due at check-in or pay now:</div>
                        <div className="mb-2 text-base text-yellow-700">
                            Remaining: {formatCurrency(remainingBalance)}
                        </div>
                        <Link to={`/booking/${refNo}/payment`}>
                            <Button variant="outline" size="lg" className="w-full cursor-pointer">Pay Remaining Balance Now</Button>
                        </Link>
                    </div>
                )}
                {booking.status === "paid" && (
                    <div className="my-7 text-green-700 font-semibold text-lg text-center">
                        Thank you! Your booking is fully paid.<br />See you at the resort!
                    </div>
                )}
                {booking.status === "completed" && (
                    <div className="my-7 text-blue-700 font-semibold text-lg text-center">
                        Thank you for staying with us!<br />We hope you enjoyed your stay.
                    </div>
                )}
                {(booking.status === "cancelled" || booking.status === "expired") && (
                    <div className="my-7 text-red-700 font-semibold text-center">
                        This booking is no longer available.
                    </div>
                )}
                {booking.status === "completed" && (
                    <Link to={`/booking/${refNo}/review`}>
                        <Button variant="secondary" size="lg" className="w-full mt-3 cursor-pointer">Leave a Review</Button>
                    </Link>
                )}
                <div className="mt-8">
                    <Link to="/">
                        <Button variant="outline" className="w-full cursor-pointer">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UnifiedBookingResultPage;
