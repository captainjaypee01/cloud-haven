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
import { CreditCard, Calendar, Users, Building, ArrowLeft, CheckCircle, Clock } from "lucide-react";

/**
 * PaymentPage: /booking/:refNo/payment
 * - Fetches booking by refNo
 * - Shows booking summary and payment options
 * - Handles payment proof upload
 */
const PaymentPage = () => {
    const { refNo } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { show, hide } = useLoader();
    const [booking, setBooking] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showProofDialog, setShowProofDialog] = useState(false);

    useEffect(() => {
        fetchBooking();
    }, []);

    const fetchBooking = async () => {
        show();
        try {
            const response = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`);
            // Handle different API response structures
            const data = response.data?.data || response.data?.booking || response.data;
            if (data) {
                setBooking(data);
            } else {
                toast.error("Failed to fetch booking details");
                navigate("/");
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
            toast.error("Failed to fetch booking details");
            navigate("/");
        } finally {
            hide();
        }
    };

    const handlePaymentClick = (option) => {
        setSelectedOption(option);
        setShowProofDialog(true);
    };

    const handleProofSuccess = () => {
        // Refresh booking data after successful proof upload
        fetchBooking();
    };

    if (!booking) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
                <SEO title="Loading..." description="Loading payment page..." noindex={true} />
                <SeaWaveBg />
                <div className="relative z-10 w-full max-w-xl mt-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading booking details...</p>
                </div>
            </div>
        );
    }

    // Calculate remaining balance and check payment status
    const getPaidAmount = (payments = []) => {
        return payments
            .filter(p => p.status === "paid") // Only count payments that were actually received
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    };

    const paidAmount = getPaidAmount(booking.payments || []);
    const actualFinalPrice = booking.final_price - (booking.discount_amount || 0);
    const downpaymentAmount = booking.downpayment_amount || (actualFinalPrice * 0.5);
    const remainingBalance = Math.max(0, actualFinalPrice - paidAmount);
    
    // Check if downpayment has been paid (total paid amount >= downpayment amount)
    const downpaymentPaid = paidAmount >= downpaymentAmount;
    // Check if full payment has been made
    const fullyPaid = paidAmount >= actualFinalPrice;

    if (fullyPaid) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
                <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
                <SeaWaveBg />
                <div className="relative z-10 w-full max-w-xl bg-white rounded-xl shadow-lg p-8 mt-20 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-green-700">This booking is already fully paid!</h2>
                    <p className="text-gray-600 mb-6">Your payment has been processed and confirmed.</p>
                    <Button onClick={() => navigate(`/booking/${refNo}`)} className="cursor-pointer">
                        View Booking Details
                    </Button>
                </div>
            </div>
        );
    }
    
    if (["cancelled", "expired"].includes(booking.status)) {
        return (
            <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
                <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
                <SeaWaveBg />
                <div className="relative z-10 w-full max-w-xl bg-white rounded-xl shadow-lg p-8 mt-20 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-red-700">This booking is no longer available.</h2>
                    <p className="text-gray-600 mb-6">The booking has been cancelled or has expired.</p>
                    <Button onClick={() => navigate(`/`)} className="cursor-pointer">
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO title="Booking Payment" description="Pay for your Netania De Laiya booking." noindex={true} />
            <SeaWaveBg />
            
            <div className="relative z-10 w-full max-w-4xl mt-20">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
                    <p className="text-gray-600">Secure your reservation by completing the payment process</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Booking Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Building className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Booking Summary</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-600 mb-1">Reference Number:</span>
                                    <span className="font-mono font-semibold text-cyan-700 text-lg">{booking.reference_number || booking.reference_no}</span>
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-600 mb-1">Guest:</span>
                                    <span className="font-medium text-gray-900 text-lg">{booking.guest_name}</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-600 mb-1">Check-in:</span>
                                        <span className="font-medium text-gray-900">{booking.check_in_date}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-600 mb-1">Check-out:</span>
                                        <span className="font-medium text-gray-900">{booking.check_out_date}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Room Total:</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(booking.total_price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Meal Total:</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(booking.meal_price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(booking.total_price + booking.meal_price)}</span>
                                        </div>
                                        {booking.discount_amount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span className="text-sm font-medium">Promo Discount:</span>
                                                <span className="text-sm font-medium">-{formatCurrency(booking.discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                            <span className="text-2xl font-bold text-cyan-700">{formatCurrency(booking.final_price - (booking.discount_amount || 0))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Payment Options */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CreditCard className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Payment Options</h3>
                            </div>
                            
                            {/* If already paid DP and remaining balance > 0, show only remaining balance payment option */}
                            {downpaymentPaid && remainingBalance > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                            <span className="font-medium text-yellow-800">Downpayment Already Paid</span>
                                        </div>
                                        <p className="text-yellow-700 text-sm">
                                            You have already paid the downpayment. You can now pay the remaining balance online or at the resort.
                                        </p>
                                    </div>
                                    
                                    <div className="border-2 border-cyan-600 bg-cyan-50 p-6 rounded-lg">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard className="h-5 w-5 text-cyan-600" />
                                                    <h4 className="text-lg font-semibold text-cyan-900">Pay Remaining Balance</h4>
                                                </div>
                                                <div className="text-2xl font-bold text-cyan-700 mb-2">{formatCurrency(remainingBalance)}</div>
                                                <p className="text-cyan-600 text-sm">
                                                    Pay now to fully settle your booking. You can also pay at the resort.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handlePaymentClick({ amount: remainingBalance, type: "full" })}
                                                className="w-full lg:w-auto px-8 py-3 text-lg font-semibold cursor-pointer bg-cyan-600 hover:bg-cyan-700"
                                            >
                                                Pay Remaining Balance
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {booking.pay_now_options?.map(opt => (
                                        <div
                                            key={opt.type}
                                            className={`border-2 p-6 rounded-lg transition-all duration-200 ${
                                                selectedOption && selectedOption.type === opt.type 
                                                    ? 'border-cyan-600 bg-cyan-50 shadow-lg scale-[1.02]' 
                                                    : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CreditCard className="h-5 w-5 text-cyan-600" />
                                                        <h4 className="text-lg font-semibold text-gray-900">{opt.label}</h4>
                                                    </div>
                                                    <div className="text-2xl font-bold text-cyan-700 mb-2">{formatCurrency(opt.amount)}</div>
                                                    <p className="text-gray-600 text-sm">
                                                        {opt.type === 'downpayment' 
                                                            ? 'Pay now, remaining balance due at check-in.' 
                                                            : 'Settle everything now, skip the counter later!'
                                                        }
                                                    </p>
                                                </div>
                                                <Button 
                                                    onClick={() => handlePaymentClick(opt)} 
                                                    className={`w-full lg:w-auto px-8 py-3 text-lg font-semibold cursor-pointer ${
                                                        opt.type === 'downpayment' 
                                                            ? 'bg-amber-600 hover:bg-amber-700' 
                                                            : 'bg-cyan-600 hover:bg-cyan-700'
                                                    }`}
                                                >
                                                    {opt.type === 'downpayment' ? 'Pay Downpayment' : 'Pay Full Amount'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Bank Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Building className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-blue-900 mb-1">Bank:</span>
                                            <span className="text-blue-800">BDO Unibank</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-blue-900 mb-1">Account Name:</span>
                                            <span className="text-blue-800">NETANIA DE LAIYA INC.</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-blue-900 mb-1">Account Number:</span>
                                            <span className="font-mono text-blue-800">004978007114</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-medium text-amber-900 mb-1">Payment Process</h4>
                                            <p className="text-amber-700 text-sm">
                                                1. Transfer payment to the account above<br/>
                                                2. Upload proof of payment<br/>
                                                3. Wait for verification (usually within 24 hours)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex justify-center">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(`/booking/${refNo}`)} 
                        className="cursor-pointer px-8 py-3 text-lg"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Booking Details
                    </Button>
                </div>
            </div>
            
            <ProofOfPaymentDialog
                open={showProofDialog}
                onOpenChange={setShowProofDialog}
                booking={booking}
                paymentOption={selectedOption}
                onSuccess={handleProofSuccess}
            />
        </div>
    );
};

export default PaymentPage;
