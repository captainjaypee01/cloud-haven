import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

export function DayTourDatePicker({ date, onChange }) {
    const formatted = date
        ? format(date, "MMM d, yyyy")
        : "Select date";

    return (
        <Popover>
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
                    onSelect={onChange}
                    className="w-full"
                    disabled={{
                        before: new Date(),
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
