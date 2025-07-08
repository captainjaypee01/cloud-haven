import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useLoader } from "@/context/LoaderContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartSummary } from "../hooks/cart/useCartSummary";
import { useApi } from "@/hooks/useApi";
import { Separator } from "@radix-ui/react-select";
import { API_PREFIX } from "@/constants/api";
import SeaWaveBg from "../components/common/SeaWaveBg";

const FormSchema = z.object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    contactNumber: z.string().min(1, { message: "Contact number is required" }),
    specialRequests: z.string().optional(),
});

const CheckoutPage = () => {
    const { state: { items, checkIn, checkOut }, clear } = useCart();
    const { navigate } = useAppContext();
    const { show, hide } = useLoader();
    const { summary, grandTotal, totalGuests, numNights, totalAdults, totalChildren, roomTotalPrice, mealCost } = useCartSummary();
    const api = useApi();

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            contactNumber: "",
            specialRequests: "",
        }
    });

    const onSubmit = async (data) => {
        show();
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
            guest_phone: data.contactNumber,
            special_requests: data.specialRequests,
            total_adults: totalAdults,
            total_children: totalChildren
        };
        try {
            const bookingRes = await api.post(`${API_PREFIX}/bookings`, bookingPayload, {
                headers: { "Content-Type": "application/json" },
            });
            const booking = bookingRes.data;
            if (!booking?.reference_number) {
                toast.error(bookingRes.data?.message || "Booking failed");
                hide();
                return;
            }
            clear();
            console.log(`/booking/${booking.reference_number}/payment`)
            navigate(`/booking/${booking.reference_number}/payment`);
        } catch (err) {
            toast.error("Something went wrong. Try again.");
        } finally {
            hide();
        }
    };


    useEffect(() => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            navigate("/cart", { replace: true });
        }
    }, [items, navigate]);
    return (
        <div className="relative min-h-screen pb-[200px] py-16 px-2 md:px-8 lg:px-32 mt-10 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                {/* -- Summary Section -- */}
                <aside className="md:col-span-1 bg-gray-50 rounded-xl shadow-lg p-6 flex flex-col gap-6 static top-auto h-auto md:sticky md:top-24 md:h-fit">
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
                {/* -- Guest Info -- */}
                <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6">
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
                            <Button className="w-full mt-4 cursor-pointer" type="submit">
                                Reserve Now
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
            <SeaWaveBg />
        </div>
    );
};

export default CheckoutPage;
