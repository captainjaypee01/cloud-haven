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

    // Nights calculation
    const numNights =
        checkIn && checkOut
            ? Math.max(differenceInDays(parseISO(checkOut), parseISO(checkIn)), 1)
            : 1;

    // Prepare summary (price per room, extra guest, subtotal)
    const summary = items.map(item => {
        const extraGuests = Math.max((item.adults + item.children) - item.maxGuests, 0);
        const extraGuestFee = extraGuests * 1000 * numNights;
        const subtotal = (item.price * numNights) + extraGuestFee;
        return {
            ...item,
            subtotal,
            extraGuests,
            extraGuestFee,
            totalGuests: item.adults + item.children,
            numNights,
        };
    });
    const grandTotal = summary.reduce((total, item) => total + item.subtotal, 0);
    const totalGuests = summary.reduce((acc, item) => acc + item.totalGuests, 0);

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

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        await new Promise(resolve => setTimeout(resolve, 2000));
        // Payment Simulation
        let paymentResult;
        try {
            paymentResult = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: grandTotal,
                    method: data.paymentMethod,
                    guest_email: data.email,
                    guest_name: data.fullName,
                }),
            }).then(r => r.json());
            if (!paymentResult.success) {
                toast.error(paymentResult.message || "Payment failed");
                setIsSubmitting(false);
                return;
            }
        } catch (err) {
            toast.error("Payment failed. Try again.");
            setIsSubmitting(false);
            return;
        }

        // Booking
        try {
            const bookingRes = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    checkIn,
                    checkOut,
                    rooms: items.map(i => ({
                        room_id: i.roomId,
                        adults: i.adults,
                        children: i.children,
                    })),
                    guest_name: data.fullName,
                    guest_email: data.email,
                    guest_contact: data.contactNumber,
                    special_requests: data.specialRequests,
                    payment_method: data.paymentMethod,
                    payment_id: paymentResult.payment_id,
                }),
            }).then(r => r.json());
            if (bookingRes.success) {
                toast.success("Booking confirmed!");
                clear();
                navigate("/booking-success");
            } else {
                toast.error(bookingRes.message || "Booking failed");
            }
        } catch (err) {
            toast.error("Booking failed. Try again.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen py-16 px-2 md:px-8 lg:px-32 bg-gray-50 mt-20">
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
                                <div className="text-xs text-gray-600">
                                    Extra guests: {item.extraGuests}
                                    {item.extraGuests > 0 && (
                                        <> ({formatCurrency(item.extraGuestFee)})</>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between border-t pt-4 font-bold text-lg">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                        <span>Total Guests</span>
                        <span>{totalGuests}</span>
                    </div>
                </aside>
                {/* -- Guest Info & Payment Section -- */}
                <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <h2 className="text-xl font-semibold mb-2">Guest Information</h2>
                            <FormField
                                name="fullName"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input type="text" {...field} className="w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="email"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" {...field} className="w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="contactNumber"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Number</FormLabel>
                                        <FormControl>
                                            <Input type="text" {...field} className="w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="specialRequests"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Special Requests</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Tell us if you need some assistance" className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="paymentMethod"
                                control={form.control}
                                render={({ field }) => (
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
                                )}
                            />
                            <Button className="w-full mt-4 cursor-pointer" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Processing..." : "Confirm Booking"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
