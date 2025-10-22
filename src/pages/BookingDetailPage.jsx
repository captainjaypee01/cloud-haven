import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "../utils/currency";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLoader } from "@/context/LoaderContext";
import { API_PREFIX } from "@/constants/api";
import SeaWaveBg from "@/components/common/SeaWaveBg";
import { BadgeAlertIcon, BadgeCheckIcon } from "lucide-react";
import { ArrowLeft, Eye, List } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as bookingsSvc from "@/services/bookings";
import { toast } from "sonner";
import { Separator } from "@radix-ui/react-select";
import SEO from "@/components/SEO";
import PaymentCard from "@/components/PaymentCard";
import MealDetailComponent from "@/components/booking/MealDetailComponent";
import { CreditCard, Building, CheckCircle } from "lucide-react";

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
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    const handlePaymentUpdate = async (updatedPayment) => {
        // Refresh the entire booking data to get the latest payment information
        try {
            const res = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`);
            const data = res.data?.data || res.data?.booking || res.data;
            setBooking(data);
        } catch (error) {
            console.error("Failed to refresh booking data:", error);
            // Fallback to just updating the payment if refresh fails
            setBooking(prev => ({
                ...prev,
                payments: prev.payments.map(p => 
                    p.id === updatedPayment.id ? updatedPayment : p
                )
            }));
        }
    };

    useEffect(() => {
        const fetchBooking = async () => {
            show();
            try {
                const res = await api.get(`${API_PREFIX}/bookings/ref/${refNo}`);
                const data = res.data?.data || res.data?.booking || res.data;
                setBooking(data);
                if (data?.last_payment_failed) setLastPaymentError(data.last_payment_failed_message || "Payment attempt failed. Please try again.");
            } catch {
                navigate("/");
            } finally {
                hide();
            }
        };
        fetchBooking();
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, [refNo]);
    const getPaidAmount = (payments = []) => {
        return payments
            .filter(p => p.status === "paid")
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }
    const { user } = useUser();
    if (!booking) return null;
    const paidAmount = getPaidAmount(booking.payments || []);
    const actualFinalPrice = (booking.final_price || 0) - (booking.discount_amount || 0) - (booking.pwd_senior_discount || 0) - (booking.special_discount || 0);
    const remainingBalance = Math.max(0, actualFinalPrice - paidAmount);
    const roomsInBookingRaw = (booking.booking_rooms || []).map((br) => br.room || br).filter(Boolean);
    const uniqueRooms = Array.from(new Map(roomsInBookingRaw.map(r => [(r?.slug || r?.id || r?.room_id || r?.name), r])).values());
    const firstRoom = roomsInBookingRaw[0];
    const getRoomId = (room) => room?.slug || room?.id || room?.room_id || room?.name;
    const handleViewRoomDetails = () => {
        if (!firstRoom) return;
        setSelectedRoomId(getRoomId(firstRoom));
        setModalOpen(true);
    };

    const handleClaim = async () => {
        try {
            await bookingsSvc.claimBookingToUser(api, refNo);
            
            toast.success("Booking Added!");
            navigate("/my-bookings");
        } catch (e) {
            // optionally show toast
            console.error(e);
            toast.success("Failed to add Booking");
        }
    };

    return (
        <div className="relative min-h-screen pb-[200px] flex flex-col items-center py-16 px-2 md:px-8 lg:px-32 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden ">
            <SEO title="Booking Details" description="View your Netania De Laiya booking details." noindex={true} />
            <SeaWaveBg />
            <div className="relative z-10 w-full max-w-7xl mt-20">
                {/* Responsive Layout: Single column on mobile, Two columns on medium+ screens */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Booking Details */}
                    <div className="flex-1 bg-white rounded-xl shadow-lg p-6 lg:p-8">
                {user && (
                    <div className="mb-4 flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/my-bookings')} className="cursor-pointer">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Bookings
                        </Button>
                    </div>
                )}
                {/* Error banner */}
                {lastPaymentError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        <b>Payment Error:</b> {lastPaymentError}
                    </div>
                )}
                {/* Badge + ref # + status */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge variant={statusColor(booking?.status)} className="text-base px-3 py-1 capitalize">
                        {booking?.status === 'completed' ? 'Completed (Checked Out)' : booking?.status?.replace("_", " ")}
                    </Badge>
                </div>
                <div className="mb-3">
                    <div className="text-sm text-gray-500">Reference No:</div>
                    <div className="font-bold text-cyan-700 text-lg">{booking.reference_number}</div>
                </div>
                {/* Booking summary grid just like PaymentPage */}
                <div className="mb-4 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between"><span>Guest</span><span>{booking.guest_name}</span></div>
                    {booking.booking_type === 'day_tour' ? (
                        <>
                            <div className="flex justify-between"><span>Day Tour Date</span><span>{formatDate(booking.check_in_date)}</span></div>
                            <div className="flex justify-between"><span>Tour Hours</span><span>8:00 AM - 5:00 PM</span></div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between"><span>Check-in</span><span>{formatDate(booking.check_in_date)}</span></div>
                            <div className="flex justify-between"><span>Check-out</span><span>{formatDate(booking.check_out_date)}</span></div>
                        </>
                    )}
                    <div className="flex justify-between"><span>Total guests</span><span>{booking.total_guests}</span></div>
                    <div className="flex justify-between"><span>Adults</span><span>{booking.adults}</span></div>
                    <div className="flex justify-between"><span>Children</span><span>{booking.children}</span></div>
                    <Separator />
                    {booking.booking_type === 'day_tour' ? (
                        <>
                            <div className="flex justify-between"><span>Guest Price</span><span>{formatCurrency(booking?.total_price)}</span></div>
                            <div className="flex justify-between"><span>Meal Price</span><span>{formatCurrency(booking?.meal_price)}</span></div>
                            <div className="flex justify-between"><span>Extra Guest Fee</span><span>{formatCurrency(booking?.extra_guest_fee)}</span></div>
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency((booking?.total_price || 0) + (booking?.meal_price || 0))}</span></div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between"><span>Room Price</span><span>{formatCurrency(booking?.total_price)}</span></div>
                            <div className="flex justify-between"><span>Meal Price</span><span>{formatCurrency(booking?.meal_price)}</span></div>
                            <div className="flex justify-between"><span>Extra Guest Fee</span><span>{formatCurrency(booking?.extra_guest_fee)}</span></div>
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency((booking?.total_price || 0) + (booking?.meal_price || 0))}</span></div>
                        </>
                    )}
                    {booking?.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600"><span>Promo Discount</span><span>-{formatCurrency(booking?.discount_amount)}</span></div>
                    )}
                    {booking?.pwd_senior_discount > 0 && (
                        <div className="flex justify-between text-green-600"><span>PWD/Senior Discount</span><span>-{formatCurrency(booking?.pwd_senior_discount)}</span></div>
                    )}
                    {booking?.special_discount > 0 && (
                        <div className="flex justify-between text-green-600"><span>Special Discount</span><span>-{formatCurrency(booking?.special_discount)}</span></div>
                    )}
                    <div className="flex justify-between font-medium text-base mt-2"><span>Total</span><span>{formatCurrency(booking?.final_price - (booking?.discount_amount || 0) - (booking?.pwd_senior_discount || 0) - (booking?.special_discount || 0))}</span></div>
                </div>
                <div className="mb-4">
                    <b>{booking.booking_type === 'day_tour' ? 'Day Tour Packages:' : 'Rooms:'}</b>
                    <ul className="list-disc ml-6 mt-1 text-sm">
                        {(booking.booking_rooms || []).map((br, idx) => {
                            const room = br.room || br;
                            const name = br.room_name || room.name || "Room";
                            const a = br.adults ?? room.adults;
                            const c = br.children ?? room.children;
                            return (
                                <li key={getRoomId(room) || br.id || idx}>
                                    {name}{(a != null || c != null) ? ` — ${a ?? 0} Adults, ${c ?? 0} Children` : ""}
                                </li>
                            );
                        })}
                    </ul>
                    {roomsInBookingRaw.length === 1 && firstRoom && (
                        <div className="mt-3">
                            <Button variant="outline" size="sm" onClick={handleViewRoomDetails} className="cursor-pointer">
                                <Eye className="w-4 h-4 mr-1" /> {booking.booking_type === 'day_tour' ? 'View Package Details' : 'View Room Details'}
                            </Button>
                        </div>
                    )}
                    {roomsInBookingRaw.length > 1 && (
                        <div className="mt-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="cursor-pointer">
                                        <List className="w-4 h-4 mr-1" /> {booking.booking_type === 'day_tour' ? 'View Packages' : 'View Rooms'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {uniqueRooms.map((room, idx) => (
                                        <DropdownMenuItem key={getRoomId(room) || idx} onClick={() => { setSelectedRoomId(getRoomId(room)); setModalOpen(true); }}>
                                            {room.name || `Room ${idx + 1}`}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
                
                {/* Day Tour Meal Breakdown */}
                {booking.booking_type === 'day_tour' && booking.meal_quote_data && (
                    <div className="mb-4">
                        <b>Meal Details:</b>
                        <div className="mt-2">
                            <MealDetailComponent 
                                mealQuoteData={booking.meal_quote_data}
                                showTitle={false}
                                className="!p-0 !shadow-none !bg-transparent"
                            />
                        </div>
                    </div>
                )}
                    </div>
                    
                    {/* Right Column: Payment Section */}
                    <div className="lg:w-96 bg-white rounded-xl shadow-lg p-6 lg:p-8">
                        {/* Payment History */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-xl text-gray-900">Payment</h3>
                            </div>
                            
                            {/* Bank Details - Displayed once for all payments */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Building className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-medium text-blue-900 text-sm">Bank Details for Payment</h4>
                                </div>
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
                            
                            {(!booking.payments || booking.payments.length === 0) ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <div className="text-gray-500 text-sm">No payments yet.</div>
                                    <div className="text-gray-400 text-xs mt-1">Payment history will appear here once payments are made.</div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {booking.payments.map((payment) => (
                                        <PaymentCard 
                                            key={payment.id} 
                                            payment={payment} 
                                            booking={booking}
                                            onPaymentUpdate={handlePaymentUpdate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Status-specific UI and actions */}
                        {booking.status === "pending" && (
                            <div className="mb-6">
                                <div className="mb-3 text-yellow-700 font-medium">Payment required to confirm your booking.</div>
                                <Link to={`/booking/${refNo}/payment`} onClick={() => { window.scrollTo(0, 0); }}>
                                    <Button size="lg" className="w-full cursor-pointer">Proceed to Payment</Button>
                                </Link>
                            </div>
                        )}
                        {booking.status === "downpayment" && (
                            <div className="mb-6">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-800">Downpayment Paid</span>
                                    </div>
                                    <p className="text-green-700 text-sm mb-3">
                                        Your downpayment has been paid and confirmed. Please settle the remaining balance at the resort during check-in.
                                    </p>
                                    <div className="p-3 bg-white border border-green-300 rounded-lg">
                                        <div className="text-sm text-green-800">
                                            <div className="font-medium mb-1">Remaining Balance:</div>
                                            <div className="text-lg font-bold">{formatCurrency(remainingBalance)}</div>
                                            <div className="text-xs mt-1">To be paid at the resort</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {booking.status === "paid" && (
                            <div className="mb-6 text-green-700 font-semibold text-lg text-center">
                                Thank you! Your booking is fully paid.<br />See you at the resort!
                            </div>
                        )}
                        {booking.status === "completed" && (
                            <div className="mb-6 text-blue-700 font-semibold text-lg text-center">
                                Thank you for staying with us!<br />We hope you enjoyed your stay.
                            </div>
                        )}
                        {(booking.status === "cancelled" || booking.status === "expired") && (
                            <div className="mb-6 text-red-700 font-semibold text-center">
                                This booking is no longer available.
                            </div>
                        )}
                        {booking.status === "completed" && (
                            <div className="mb-6 text-blue-700 font-semibold text-center">
                                A review request will be sent to your email after your stay.
                            </div>
                        )}
                        {/* Claim/Add to My Bookings if not attached */}
                        {user && !booking.user && (
                            <div className="mb-4">
                                <Button variant="outline" className="w-full cursor-pointer" onClick={handleClaim}>Add to My Bookings</Button>
                            </div>
                        )}
                        <div>
                            <Link to="/">
                                <Button variant="outline" className="w-full cursor-pointer">Back to Home</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <RoomDetailModal
                open={modalOpen}
                roomId={selectedRoomId}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) setSelectedRoomId(null);
                }}
            />
        </div>
    );
};

export default UnifiedBookingResultPage;
