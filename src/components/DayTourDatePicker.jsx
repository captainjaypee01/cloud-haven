import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon, X } from "lucide-react";
import { useState } from "react";

export function DayTourDatePicker({ date, onChange, disabledRanges = [] }) {
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
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-left cursor-pointer">
                    {formatted}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-auto p-0" 
                align="center"
                onPointerDownOutside={(e) => {
                    // Prevent popover from closing when clicking inside the dialog
                    const target = e.target;
                    if (target?.closest?.('[data-slot="dialog-content"]')) {
                        e.preventDefault();
                    }
                }}
                onInteractOutside={(e) => {
                    // Prevent popover from closing when interacting with calendar inside dialog
                    const target = e.target;
                    if (target?.closest?.('[data-slot="dialog-content"]')) {
                        e.preventDefault();
                    }
                }}
            >
                <div 
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto"
                >
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
                </div>
            </PopoverContent>
        </Popover>
    );
}
