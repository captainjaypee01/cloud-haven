import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { differenceInDays, parseISO } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartSummary } from "../hooks/cart/useCartSummary";
import { useApi } from "@/hooks/useApi";
import { Separator } from "@radix-ui/react-select";
import Loader from "@/components/common/Loader"; // Custom spinner component
import { API_PREFIX } from "@/constants/api";

const FormSchema = z.object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    contactNumber: z.string().min(1, { message: "Contact number is required" }),
    specialRequests: z.string().optional(),
    paymentMethod: z.string().min(1, { message: "Please select a payment method" }),
});

const CheckoutPage = () => {
    const { state: { items, checkIn, checkOut }, clear } = useCart();
    const { navigate } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentStep, setPaymentStep] = useState("form"); // "form" | "option"
    const [bookingData, setBookingData] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const { summary, grandTotal, totalGuests, numNights, totalAdults, totalChildren, roomTotalPrice, mealCost } = useCartSummary();
    const api = useApi();

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            contactNumber: "",
            specialRequests: "",
            paymentMethod: "",
        }
    });

    // Step 1: Create Booking, get options
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const bookingPayload = {
            check_in_date: checkIn,
            check_out_date: checkOut,
            rooms: summary.map(item => ({
                room_unique_id: item.uniqueId,
                room_id: item.roomId,
                adults: item.adults,
                children: item.children,
            })),
            guest_name: data.fullName,
            guest_email: data.email,
            guest_contact: data.contactNumber,
            special_requests: data.specialRequests,
            payment_method: data.paymentMethod,
            amount: grandTotal,
            total_adults: totalAdults,
            total_children: totalChildren
        };
        try {
            const bookingRes = await api.post(`${API_PREFIX}/bookings`, bookingPayload, {
                headers: { "Content-Type": "application/json" },
            });
            const booking = bookingRes.data?.data || bookingRes.data?.booking || bookingRes.data;
            if (!bookingRes.data?.success || !booking?.id) {
                toast.error(bookingRes.data?.message || "Booking failed");
                setIsSubmitting(false);
                return;
            }
            setBookingData(booking);
            setPaymentStep("option"); // Go to payment selection step
        } catch (err) {
            console.log(err);
            toast.error("Something went wrong. Try again.");
        }
        setIsSubmitting(false);
    };
    // Step 2: User selects payment option, then proceed to vendor checkout (or payment API)
    const onSelectPaymentOption = async (option) => {
        setSelectedOption(option);
        setIsSubmitting(true);
        try {
            // Call your payment API (or redirect to vendor checkout)
            const paymentPayload = {
                amount: option.amount,
                provider: bookingData.payment_method,
                payment_option: option.type // 'downpayment' or 'full'
            };
            const paymentRes = await api.post(`${API_PREFIX}/bookings/${bookingData.id}/pay`, paymentPayload, {
                headers: { "Content-Type": "application/json" },
            });
            if (paymentRes.data?.success) {
                toast.success("Payment successful!");
                clear();
                navigate("/booking-success");
            } else {
                toast.error(paymentRes.data?.errorMessage || paymentRes.data?.message || "Payment failed");
            }
        } catch (err) {
            toast.error("Payment error. Try again.");
        }
        setIsSubmitting(false);
    };

    const onSubmit2 = async (data) => {

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Build the booking payload
        const bookingPayload = {
            checkIn,
            checkOut,
            rooms: summary.map(item => ({
                room_unique_id: item.uniqueId,
                room_id: item.roomId,
                adults: item.adults,
                children: item.children,
            })),
            guest_name: data.fullName,
            guest_email: data.email,
            guest_contact: data.contactNumber,
            special_requests: data.specialRequests,
            payment_method: data.paymentMethod,
            amount: grandTotal,
        };

        try {
            // 2. Create booking
            const bookingRes = await api.post("/api/bookings", bookingPayload, {
                headers: { "Content-Type": "application/json" },
            });
            const booking = bookingRes.data?.data || bookingRes.data?.booking || bookingRes.data;
            if (!bookingRes.data?.success || !booking?.id) {
                toast.error(bookingRes.data?.message || "Booking failed");
                setIsSubmitting(false);
                return;
            }

            // 3. Build payment payload
            const paymentPayload = {
                amount: grandTotal,
                provider: data.paymentMethod, // e.g. 'credit_card', 'gcash'
                // (add more if needed)
            };

            // 4. Pay for the booking
            const paymentRes = await api.post(`/api/bookings/${booking.id}/pay`, paymentPayload, {
                headers: { "Content-Type": "application/json" },
            });

            if (paymentRes.data?.success) {
                toast.success("Booking and payment successful!");
                clear();
                navigate("/booking-success");
            } else {
                toast.error(paymentRes.data?.errorMessage || paymentRes.data?.message || "Payment failed");
                // Optionally: handle partial/downpayment here
            }
        } catch (err) {
            toast.error("Something went wrong. Try again.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen py-16 px-2 md:px-8 lg:px-32 bg-gray-50 mt-20">
            {isSubmitting && (
                <Loader variant="wave" />
            )}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* -- Summary Section -- */}
                <aside className="md:col-span-1 bg-gray-50 rounded-xl shadow-lg p-6 flex flex-col gap-6
                    static top-auto h-auto
                    md:sticky md:top-24 md:h-fit
                ">


                    <h2 className="text-xl font-semibold mb-2">Booking Summary</h2>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Check-in date</span>
                            <span>{checkIn || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Check-out date</span>
                            <span>{checkOut || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Number of nights</span>
                            <span>{numNights}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total guests</span>
                            <span>{totalGuests}</span>
                        </div>
                    </div>
                    <div className="space-y-3 mt-4">
                        {summary.map(item => (
                            <div key={item.uniqueId} className="border rounded-lg p-4 bg-white">
                                <div className="flex justify-between">
                                    <span className="font-medium">{item.name}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    {item.totalGuests} guests (<span>{item.adults}A / {item.children}C</span>), {numNights} night{numNights > 1 ? "s" : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium border-t pt-4">
                        <span>Total Room Price:</span>
                        <span>{formatCurrency(roomTotalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                        <span>Meals (Adult × {totalAdults}, Child × {totalChildren}):</span>
                        <span>{formatCurrency(mealCost)}</span>
                    </div>
                    <div className="mt-4 flex justify-between border-t pt-4 font-bold text-lg">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                </aside>
                {/* -- Guest Info & Payment Section -- */}
                <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">
                    {paymentStep === "form" && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <h2 className="text-xl font-semibold mb-2">Guest Information</h2>
                                <FormField name="fullName" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Full name</FormLabel><FormControl><Input type="text" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="email" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="contactNumber" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input type="text" {...field} className="w-full" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="specialRequests" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Special Requests</FormLabel><FormControl><Textarea placeholder="Tell us if you need some assistance" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="paymentMethod" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select payment method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                                    <SelectItem value="gcash">GCash</SelectItem>
                                                    <SelectItem value="pay_at_resort">Pay at Resort</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button className="w-full mt-4 cursor-pointer" type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Confirm Booking"}</Button>
                            </form>
                        </Form>
                    )}
                    {paymentStep === "option" && bookingData && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-2">Choose Payment Option</h2>
                            <p>Your booking is reserved. Select how you'd like to pay:</p>
                            {bookingData.pay_now_options?.map(opt => (
                                <div key={opt.type} className={`border p-4 rounded-lg flex items-center justify-between mb-2 ${selectedOption && selectedOption.type === opt.type ? 'border-cyan-600 bg-cyan-50' : 'border-gray-300'}`}>
                                    <div>
                                        <div className="font-semibold">{opt.label}</div>
                                        <div className="text-cyan-700 text-lg">{formatCurrency(opt.amount)}</div>
                                        <div className="text-gray-500 text-xs mt-1">{opt.type === 'downpayment' ? `Pay now, remaining balance due at check-in.` : `Settle everything now, skip the counter later!`}</div>
                                    </div>
                                    <Button disabled={isSubmitting} onClick={() => onSelectPaymentOption(opt)}>
                                        {isSubmitting && selectedOption?.type === opt.type ? 'Processing...' : 'Pay Now'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
