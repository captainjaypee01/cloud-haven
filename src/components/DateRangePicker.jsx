import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

export function DateRangePicker({ range, onChange }) {
    const formatted = range.from && range.to
        ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
        : "Select dates";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[100%] justify-between text-left">
                    {formatted}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={onChange}
                    numberOfMonths={2}
                    className="w-[100%]"
                    disabled={{
                        before: new Date(),
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
