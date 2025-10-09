
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { useCart } from "../context/CartContext";
import { format, parseISO } from "date-fns";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useMealDateRangesContext } from "../context/MealDateRangesContext";
import { toast } from "sonner";

const SearchForm = () => {

    const location = useLocation()
    const { navigate } = useAppContext();
    const { setDates, state, clearPromoCodesOnly } = useCart();
    const { dateRanges, hasActivePrograms, loading: dateRangesLoading } = useMealDateRangesContext();

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
        
        // If dates are cleared, clear the cart state and reset form
        if (!from || !to) {
            setDates('', '');
            // Also explicitly clear promo codes
            clearPromoCodesOnly();
            // Force form reset to ensure UI reflects cleared state
            reset({ dateRange: { from: null, to: null } });
            return;
        }
        
        // Only proceed when both dates are selected
        if (from && to) {
            // Validate that dates are within available meal program ranges (if any)
            if (hasActivePrograms && dateRanges.length > 0) {
                const fromStr = format(from, "yyyy-MM-dd");
                const toStr = format(to, "yyyy-MM-dd");
                
                const isFromValid = dateRanges.some(range => 
                    fromStr >= range.start && fromStr <= range.end
                );
                const isToValid = dateRanges.some(range => 
                    toStr >= range.start && toStr <= range.end
                );
                
                if (!isFromValid || !isToValid) {
                    toast.warning("Selected dates are not available. Please choose dates within the available meal program periods.");
                    return;
                }
            }
            
            // Clear promo codes before setting new dates
            clearPromoCodesOnly();
            setDates(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
            if(location.pathname !== "/rooms") navigate("/rooms");
        }
    }

    const handleFormSubmit = ({ dateRange }) => {
        const { from, to } = dateRange;
        
        // Validate that dates are selected before submitting
        if (!from || !to) {
            toast.warning("Please select both check-in and check-out dates.");
            return;
        }
        
        // Additional check: ensure cart state also has dates
        if (!state.checkIn || !state.checkOut) {
            toast.warning("Please select both check-in and check-out dates.");
            return;
        }
        
        // If we reach here, dates are valid and already set in cart state
        // Just navigate to rooms page
        if(location.pathname !== "/rooms") navigate("/rooms");
    }
    return (
        <form
            onSubmit={handleSubmit(handleFormSubmit)}
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
                            onChange={(dateRange) => {
                                field.onChange(dateRange);
                                handleDateSelection({ dateRange });
                            }}
                            disabledRanges={hasActivePrograms ? dateRanges : []}
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