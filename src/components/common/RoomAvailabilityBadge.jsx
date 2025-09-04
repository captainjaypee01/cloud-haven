import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

/**
 * Component to display room availability as a badge
 * 
 * @param {Object} props - Component props
 * @param {number} props.availableUnits - Number of available units
 * @param {number} props.pending - Number of units pending (locked + pending verification)
 * @param {boolean} props.isLoading - Whether availability is loading
 * @param {boolean} props.isError - Whether there was an error loading availability
 * @param {boolean} props.isDebouncing - Whether the input is being debounced
 * @param {string} props.size - Badge size ('sm' | 'default' | 'lg')
 * @param {string} props.className - Additional CSS classes
 * 
 * @returns {JSX.Element} The availability badge component
 */
export const RoomAvailabilityBadge = ({
    availableUnits,
    pending = 0,
    isLoading = false,
    isError = false,
    isDebouncing = false,
    size = 'default',
    className = '',
}) => {
    // Show skeleton while loading or debouncing
    if (isLoading || isDebouncing) {
        return (
            <Skeleton 
                className={`h-6 w-16 rounded-full ${className}`} 
                aria-label="Loading availability"
            />
        );
    }

    // Show error state
    if (isError) {
        return (
            <Badge 
                variant="destructive" 
                className={`flex items-center gap-1 ${className}`}
                aria-label="Error loading availability"
            >
                <AlertCircle className="w-3 h-3" />
                Error
            </Badge>
        );
    }

    // Don't show anything if availability is undefined
    if (availableUnits === undefined) {
        return null;
    }

    // Determine badge content and variant based on availability
    const getBadgeProps = () => {
        if (availableUnits === 0) {
            if (pending > 0) {
                return {
                    variant: "secondary",
                    text: `${pending} pending`,
                    ariaLabel: `${pending} units pending`
                };
            }
            return {
                variant: "destructive",
                text: "Sold out",
                ariaLabel: "No rooms available"
            };
        }
        
        if (availableUnits <= 5) {
            const text = pending > 0 
                ? `${availableUnits} left, ${pending} pending`
                : `${availableUnits} left`;
            return {
                variant: "secondary",
                text: text,
                ariaLabel: `${availableUnits} rooms available, ${pending} pending`
            };
        }
        
        const text = pending > 0 
            ? `${availableUnits} available, ${pending} pending`
            : `${availableUnits} available`;
        return {
            variant: "default",
            text: text,
            ariaLabel: `${availableUnits} rooms available, ${pending} pending`
        };
    };

    const { variant, text, ariaLabel } = getBadgeProps();

    return (
        <Badge 
            variant={variant}
            className={`
                ${size === 'sm' ? 'text-xs px-2 py-1' : ''}
                ${size === 'lg' ? 'text-base px-3 py-2' : ''}
                ${className}
            `}
            aria-label={ariaLabel}
        >
            {text}
        </Badge>
    );
};
