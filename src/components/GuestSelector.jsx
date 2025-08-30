import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectLabel,
    SelectItem,
} from "@/components/ui/select";
import { SelectGroup } from "./ui/select";

// Reusable guest selector component
export function GuestSelector({ name, maxGuests, value, defaultValue = "1", onChange, isPopover = false, isDialog = false }) {
    return (
        <Select name={name}
            defaultValue={defaultValue}
            value={value ?? ""}
            onValueChange={onChange}>
            <SelectTrigger className={
                isPopover ? "w-[120px]" : 
                isDialog ? "w-full" : 
                "w-full sm:w-[240px]"
            }>
                <SelectValue placeholder={"Select number of guests"} />
            </SelectTrigger>
            <SelectContent 
                position="popper" 
                className="w-[var(--radix-select-trigger-width)] max-h-[200px] z-50"
                sideOffset={4}
            >
                <SelectGroup>
                    {Array.from({ length: maxGuests + 1 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={String(num)}>
                            {num} {num > 1 ? "guests" : "guest"}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}