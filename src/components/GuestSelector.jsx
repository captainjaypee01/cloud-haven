import { useState } from "react";
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
export function GuestSelector({ name, maxGuests, value, defaultValue = "1", onChange, isPopover = false }) {
    return (
        <Select name={name}
            defaultValue={defaultValue}
            value={value ?? ""}
            onValueChange={onChange}
            className="w-full">
            <SelectTrigger className={isPopover ? "w-[120px]" : "w-[100%] sm:w-[240px]"}>

                <SelectValue placeholder={"Select number of guests"} />
            </SelectTrigger>
            <SelectContent className="w-full">

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