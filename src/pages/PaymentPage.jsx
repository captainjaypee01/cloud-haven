import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "../utils/currency";
import { Button } from "@/components/ui/button";
import { useLoader } from "@/context/LoaderContext";
import { toast } from "sonner";
import { API_PREFIX } from "@/constants/api";

/**
 * PaymentPage: /booking/:refNo/payment
 * - Fetches booking by refNo
 * - Shows booking summary & payment options
 * - User pays (simulates payment or redirects to vendor)
 */
const PaymentPage = () => {
    const { refNo } = useParams();
    const api = useApi();
    const navigate = useNavigate();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            show()
            try {
                const res = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`); // e.g. GET /api/bookings/ref/ABCD1234
                const data = res.data?.data || res.data?.booking || res.data;
                setBooking(data);
            } catch (err) {
                toast.error("Booking not found");
                navigate("/");
            } finally {
                hide()
            }
        };
        fetchBooking();
        // eslint-disable-next-line
    }, [refNo]);

    const handlePay = async (option) => {
        setSelectedOption(option);
        setPaying(true);
        try {
            const paymentPayload = {
                amount: option.amount,
                payment_option: option.type // 'downpayment' or 'full'
            };
            // Simulate vendor by POST to /api/bookings/:refNo/pay
            const res = await api.post(`/api/bookings/ref/${refNo}/pay`, paymentPayload, {
                headers: { "Content-Type": "application/json" },
            });
            if (res.data?.success) {
                toast.success("Payment successful!");
                navigate(`/booking/${refNo}/success`);
            } else {
                toast.error(res.data?.errorMessage || res.data?.message || "Payment failed");
            }
        } catch (err) {
            toast.error("Payment error. Try again.");
        } finally {
            setPaying(false);
        }
    };

    if (!booking) return null;

    // Already paid or expired
    if (booking.status === "paid") {
        return (
            <div className="max-w-xl mx-auto py-24">
                <h2 className="text-2xl font-bold mb-4">This booking is already paid!</h2>
                <Button onClick={() => navigate(`/booking/${refNo}`)}>View Booking Details</Button>
            </div>
        );
    }
    if (["cancelled", "expired"].includes(booking.status)) {
        return (
            <div className="max-w-xl mx-auto py-24">
                <h2 className="text-2xl font-bold mb-4">This booking is no longer available.</h2>
                <Button onClick={() => navigate(`/`)}>Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 mt-10">
                <h2 className="text-xl font-semibold mb-4">Booking Payment</h2>
                <div className="mb-3">
                    <div className="text-sm text-gray-500">Reference No:</div>
                    <div className="font-bold text-cyan-700 text-lg">{booking.reference_no}</div>
                </div>
                <div className="mb-4 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between"><span>Guest</span><span>{booking.guest_name}</span></div>
                    <div className="flex justify-between"><span>Check-in</span><span>{booking.check_in_date}</span></div>
                    <div className="flex justify-between"><span>Check-out</span><span>{booking.check_out_date}</span></div>
                    <div className="flex justify-between"><span>Total</span><span>{formatCurrency(booking.final_price)}</span></div>
                </div>
                <hr className="my-4" />
                <h3 className="text-lg font-medium mb-2">How would you like to pay?</h3>
                <div className="space-y-3">
                    {booking.pay_now_options?.map(opt => (
                        <div key={opt.type} className={`border p-4 rounded-lg flex items-center justify-between mb-2 ${selectedOption && selectedOption.type === opt.type ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300'}`}>
                            <div>
                                <div className="font-semibold">{opt.label}</div>
                                <div className="text-cyan-700 text-lg">{formatCurrency(opt.amount)}</div>
                                <div className="text-gray-500 text-xs mt-1">{opt.type === 'downpayment' ? `Pay now, remaining balance due at check-in.` : `Settle everything now, skip the counter later!`}</div>
                            </div>
                            <Button disabled={paying} onClick={() => handlePay(opt)}>
                                {paying && selectedOption?.type === opt.type ? 'Processing...' : (opt.type === 'downpayment' ? 'Pay Downpayment' : 'Pay Full')}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
