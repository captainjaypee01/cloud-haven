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
        // If we have both dates selected, check if they're the same
        if (selectedRange?.from && selectedRange?.to) {
            const fromStr = format(selectedRange.from, 'yyyy-MM-dd');
            const toStr = format(selectedRange.to, 'yyyy-MM-dd');
            
            // If check-in and check-out are the same date, set check-out to next day
            if (fromStr === toStr) {
                const nextDay = new Date(selectedRange.from);
                nextDay.setDate(nextDay.getDate() + 1);
                selectedRange = { from: selectedRange.from, to: nextDay };
            }
        }
        
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

    // Create disabled function that checks past dates, meal program ranges, and 5-day limit
    const isDateDisabled = (date) => {
        // Disable past dates
        if (date < new Date()) {
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

        // If we have a check-out date selected, enforce 5-day maximum limit from that date
        if (range?.to) {
            const checkOutDate = new Date(range.to);
            const daysDifference = Math.ceil((checkOutDate - date) / (1000 * 60 * 60 * 24));
            
            // Disable dates more than 5 days before check-out
            if (daysDifference > 5) {
                return true;
            }
        }

        // If no meal program ranges are provided, only apply above rules
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
                <Button variant="outline" className="w-[100%] justify-between text-left">
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
                </div>
            </PopoverContent>
        </Popover>
    );
}
