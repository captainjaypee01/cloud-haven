import React, { useState } from 'react';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectLabel,
    SelectItem,
} from "@/components/ui/select";
import { SelectGroup } from "./ui/select";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ChildPolicyDialog } from "./common/ChildPolicyDialog";

// Reusable guest selector component
export function GuestSelector({ 
    name, 
    maxGuests, 
    minGuests = 0, 
    value, 
    defaultValue = "1", 
    onChange, 
    isPopover = false, 
    isDialog = false,
    showChildPolicy = false 
}) {
    const [showPolicyDialog, setShowPolicyDialog] = useState(false);

    const handlePolicyClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPolicyDialog(true);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Select name={name}
                    value={value ?? ""}
                    onValueChange={onChange}>
                    <SelectTrigger className={
                        isPopover ? "w-[120px]" : 
                        isDialog ? "w-full" : 
                        "w-full sm:w-[240px] md:w-[200px] px-2"
                    }>
                        <SelectValue placeholder={"Select number of guests"} />
                    </SelectTrigger>
                    <SelectContent 
                        position="popper" 
                        className="w-[var(--radix-select-trigger-width)] max-h-[200px] z-50"
                        sideOffset={4}
                    >
                        <SelectGroup>
                            {Array.from({ length: maxGuests - minGuests + 1 }, (_, i) => i + minGuests).map((num) => (
                                <SelectItem key={num} value={String(num)}>
                                    {num} {num > 1 ? "guests" : "guest"}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                
                {/* Child Policy Button */}
                {showChildPolicy && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePolicyClick}
                        className="cursor-pointer flex items-center gap-1 px-2 py-1 h-8"
                        title="View child policy"
                    >
                        <Info className="w-3 h-3" />
                        <span className="text-xs">Policy</span>
                    </Button>
                )}
            </div>

            {/* Child Policy Dialog */}
            <ChildPolicyDialog 
                open={showPolicyDialog} 
                onOpenChange={setShowPolicyDialog} 
            />
        </div>
    );
}