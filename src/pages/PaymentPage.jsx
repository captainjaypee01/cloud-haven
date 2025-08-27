import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "../utils/currency";
import { Button } from "@/components/ui/button";
import { useLoader } from "@/context/LoaderContext";
import { toast } from "sonner";
import { API_PREFIX } from "@/constants/api";
import SeaWaveBg from "../components/common/SeaWaveBg";
import SEO from "@/components/SEO";
import ProofOfPaymentDialog from "../components/payment/ProofOfPaymentDialog";

/**
 * PaymentPage: /booking/:refNo/payment
 * - Fetches booking by refNo
 * - Shows booking summary & payment options
 * - User pays (simulates payment or redirects to vendor)
 */

const getPaidAmount = (payments = []) => {
    return payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
}

const PaymentPage = () => {
    const { refNo } = useParams();
    const api = useApi();
    const navigate = useNavigate();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showProofDialog, setShowProofDialog] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            show()
            try {
                const res = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`);
                const data = res.data?.data || res.data?.booking || res.data;
                setBooking(data);
            } catch {
                toast.error("Booking not found");
                navigate("/");
            } finally {
                hide()
            }
        };
        fetchBooking();
    }, [refNo]);

    const handlePaymentClick = (option) => {
        setSelectedOption(option);
        setShowProofDialog(true);
    };

    const handleProofSuccess = () => {
        setShowProofDialog(false);
        toast.success("Proof submitted. We'll verify shortly.");
        navigate(`/booking/${refNo}`);
    };

    if (!booking) return null;

    const paidAmount = getPaidAmount(booking.payments || []);
    const remainingBalance = Math.max(0, (booking.final_price || 0) - paidAmount);

    // Already fully paid or expired/cancelled
    if (booking.status === "paid" || booking.status === "completed") {
        return (
            <div className="max-w-xl mx-auto py-24 mt-20">
                <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
                <h2 className="text-2xl font-bold mb-4 text-cyan-700">This booking is already fully paid!</h2>
                <Button onClick={() => navigate(`/booking/${refNo}`)} className="cursor-pointer">View Booking Details</Button>
            </div>
        );
    }
    if (["cancelled", "expired"].includes(booking.status)) {
        return (
            <div className="max-w-xl mx-auto py-24 mt-20">
                <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
                <h2 className="text-2xl font-bold mb-4 text-red-700">This booking is no longer available.</h2>
                <Button onClick={() => navigate(`/`)} className="cursor-pointer">Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-20">
                <h2 className="text-xl font-semibold mb-4">Booking Payment</h2>
                <div className="mb-3">
                    <div className="text-sm text-gray-500">Reference No:</div>
                    <div className="font-bold text-cyan-700 text-lg">{booking.reference_number || booking.reference_no}</div>
                </div>
                <div className="mb-4 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between"><span>Guest</span><span>{booking.guest_name}</span></div>
                    <div className="flex justify-between"><span>Check-in</span><span>{booking.check_in_date}</span></div>
                    <div className="flex justify-between"><span>Check-out</span><span>{booking.check_out_date}</span></div>
                    <div className="flex justify-between font-medium text-base mt-2"><span>Total</span><span>{formatCurrency(booking.final_price)}</span></div>
                </div>
                <hr className="my-4" />
                <h3 className="text-lg font-medium mb-2">How would you like to pay?</h3>
                {/* If already paid DP and remaining balance > 0, show only remaining balance payment option */}
                {booking.status === "downpayment" && remainingBalance > 0 ? (
                    <>
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                            You have already paid the downpayment. You can now pay the remaining balance online or at the resort.
                        </div>
                        <div className="border border-cyan-600 bg-cyan-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <div>
                                <div className="font-semibold text-base">Pay Remaining Balance</div>
                                <div className="text-cyan-700 text-lg">{formatCurrency(remainingBalance)}</div>
                                <div className="text-gray-500 text-xs mt-1">
                                    Pay now to fully settle your booking. You can also pay at the resort.
                                </div>
                            </div>
                            <Button
                                onClick={() => handlePaymentClick({ amount: remainingBalance, type: "full" })}
                                className="w-full sm:w-48 mt-4 sm:mt-0 ml-0 sm:ml-4 cursor-pointer"
                            >
                                Pay Remaining Balance
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        {booking.pay_now_options?.map(opt => (
                            <div
                                key={opt.type}
                                className={`border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 bg-white/70
                                ${selectedOption && selectedOption.type === opt.type ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300'}`}
                            >
                                <div>
                                    <div className="font-semibold text-base">{opt.label}</div>
                                    <div className="text-cyan-700 text-lg">{formatCurrency(opt.amount)}</div>
                                    <div className="text-gray-500 text-xs mt-1">{opt.type === 'downpayment' ? `Pay now, remaining balance due at check-in.` : `Settle everything now, skip the counter later!`}</div>
                                </div>
                                <Button onClick={() => handlePaymentClick(opt)} className="w-full sm:w-48 mt-4 sm:mt-0 ml-0 sm:ml-4 cursor-pointer">
                                    {opt.type === 'downpayment' ? 'Pay Downpayment' : 'Pay Full'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-8 flex justify-end">
                    <Button variant="outline" onClick={() => navigate(`/booking/${refNo}`)} className="cursor-pointer">
                        Back to Booking Details
                    </Button>
                </div>
            </div>
            
            {/* Proof of Payment Dialog */}
            <ProofOfPaymentDialog
                open={showProofDialog}
                onOpenChange={setShowProofDialog}
                booking={booking}
                paymentOption={selectedOption}
                onSuccess={handleProofSuccess}
            />
            
            <SeaWaveBg />
        </div >
    );
};

export default PaymentPage;
