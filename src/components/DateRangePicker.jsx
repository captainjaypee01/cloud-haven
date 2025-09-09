import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon, X, Check } from "lucide-react";
import { useState } from "react";

export function DateRangePicker({ range, onChange, disabledRanges = [] }) {
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

    // Create disabled function that checks both past dates and meal program ranges
    const isDateDisabled = (date) => {
        // Disable past dates
        if (date < new Date()) {
            return true;
        }

        // If no meal program ranges are provided, only disable past dates
        if (disabledRanges.length === 0) {
            return false;
        }

        // Check if date falls within any available range
        const dateStr = format(date, 'yyyy-MM-dd');
        return !disabledRanges.some(range => 
            dateStr >= range.start && dateStr <= range.end
        );
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
