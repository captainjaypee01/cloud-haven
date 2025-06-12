
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";

const SearchForm = ({ onSearch }) => {

    const { control, handleSubmit } = useForm({
        defaultValues: { dateRange: { from: null, to: null }, adults: 2, children: 0 },
    });

    return (
        <form
            onSubmit={handleSubmit(onSearch)}
            className="
                grid
                grid-cols-1
                md:grid-cols-1
                lg:grid-cols-2
                xl:grid-cols-3
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

            {/* Adults Input */}
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

            {/* Children Input */}
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
                <Button type="submit" size="lg" className="w-full">
                    Search
                </Button>
            </div>
        </form>


    );
}
export default SearchForm;