
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { useCart } from "../context/CartContext";
import { format, parseISO } from "date-fns";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const SearchForm = () => {

    const location = useLocation()
    const { navigate } = useAppContext();
    const { dispatch, state } = useCart();

    const { control, handleSubmit, reset } = useForm({
        defaultValues: { dateRange: { from: state?.checkIn ? parseISO(state.checkIn) : null, to: state?.checkOut ? parseISO(state.checkOut) : null } },
    });

    // Reset form when cart state changes (e.g., when cart is cleared)
    useEffect(() => {
        const from = state?.checkIn ? parseISO(state.checkIn) : null;
        const to = state?.checkOut ? parseISO(state.checkOut) : null;
        reset({ dateRange: { from, to } });
    }, [state?.checkIn, state?.checkOut, reset]);

    const handleDateSelection = ({ dateRange }) => {
        const { from, to } = dateRange;
        dispatch({ type: 'SET_DATES', from: format(from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") });
        if(location.pathname !== "/rooms") navigate("/rooms");
    }
    return (
        <form
            onSubmit={handleSubmit(handleDateSelection)}
            className="
                grid
                grid-cols-1
                md:grid-cols-1
                lg:grid-cols-1
                xl:grid-cols-1
                gap-4
                items-end
                bg-white p-6 rounded-lg shadow-lg max-w-full
            "
        >
            {/* Date Picker: spans 2 columns */}
            <div className="col-span-1">
                <label className="col-span-1 md:col-span-1 lg:grid-cols-1">Check-in & Check-out Date</label>
                <Controller
                    name="dateRange"
                    control={control}
                    render={({ field }) => (
                        <DateRangePicker
                            range={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />
            </div>

            {/* Adults Input 
            <div className="col-span-1">
                <label className="text-sm font-medium block mb-1">Adults</label>
                <Controller
                    name="adults"
                    control={control}
                    render={({ field }) => (
                        <Input type="number" min={1} {...field} className="w-full" />
                    )}
                />
            </div>

            {/* Children Input 
            <div className="col-span-1">
                <label className="text-sm font-medium block mb-1">Children</label>
                <Controller
                    name="children"
                    control={control}
                    render={({ field }) => (
                        <Input type="number" min={0} {...field} className="w-full" />
                    )}
                />
            </div>

            {/* Search Button spans single column */}
            <div className="col-span-1 md:col-span-1 lg:col-span-3 w-full">
                <Button type="submit" size="lg" className="w-full cursor-pointer">
                    Search
                </Button>
            </div>
        </form>


    );
}
export default SearchForm;