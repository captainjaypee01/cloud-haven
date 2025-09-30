import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, startOfDay } from "date-fns";
import { ChevronDownIcon, X, Check } from "lucide-react";
import { useState } from "react";

export function WalkInDayTourDatePicker({ date, onChange }) {
    const [open, setOpen] = useState(false);
    
    const formatted = date
        ? format(date, "MMM d, yyyy")
        : "Select date";

    const handleDateSelect = (selectedDate) => {
        onChange(selectedDate);
        // Auto-close when a date is selected
        if (selectedDate) {
            setOpen(false);
        }
    };

    const handleClear = () => {
        onChange(null);
    };

    // Create disabled function that only disables past dates (not today)
    const isDateDisabled = (date) => {
        // Only disable dates before today (allow today)
        const today = startOfDay(new Date());
        return date < today;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-left cursor-pointer">
                    {formatted}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    className="w-full"
                    disabled={isDateDisabled}
                    footer={
                        date ? (
                            <Button
                                variant="ghost"
                                className="w-full h-8 text-sm font-medium"
                                onClick={handleClear}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        ) : null
                    }
                />
            </PopoverContent>
        </Popover>
    );
}

export function WalkInDateRangePicker({ range, onChange }) {
    const [open, setOpen] = useState(false);
    
    const formatted = range.from && range.to
        ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
        : "Select dates";

    const handleDateSelect = (selectedRange) => {
        onChange(selectedRange);
    };

    const handleClear = () => {
        onChange({ from: null, to: null });
    };

    const handleDone = () => {
        setOpen(false);
    };

    const hasSelection = range?.from || range?.to;
    const isComplete = range?.from && range?.to;

    // Create disabled function that only disables past dates (not today) and enforces 5-day limit
    const isDateDisabled = (date) => {
        // Only disable dates before today (allow today)
        const today = startOfDay(new Date());
        if (date < today) {
            return true;
        }

        // If we have a check-in date selected, enforce 5-day maximum limit
        if (range?.from) {
            const checkInDate = new Date(range.from);
            const daysDifference = Math.ceil((date - checkInDate) / (1000 * 60 * 60 * 24));
            
            // Disable dates more than 5 days after check-in
            if (daysDifference > 5) {
                return true;
            }
        }

        return false;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[100%] justify-between text-left">
                    {formatted}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    className="w-[100%]"
                    disabled={isDateDisabled}
                    footer={
                        <div className="flex gap-2 p-2 border-t">
                            {hasSelection && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 h-8 text-sm"
                                    onClick={handleClear}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                            {isComplete && (
                                <Button
                                    size="sm"
                                    className="flex-1 h-8 text-sm"
                                    onClick={handleDone}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Done
                                </Button>
                            )}
                        </div>
                    }
                />
            </PopoverContent>
        </Popover>
    );
}
