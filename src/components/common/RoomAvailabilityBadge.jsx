import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

/**
 * Component to display room availability as a badge
 * 
 * @param {Object} props - Component props
 * @param {number} props.availableUnits - Number of available units
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
            return {
                variant: "destructive",
                text: "Sold out",
                ariaLabel: "No rooms available"
            };
        }
        
        if (availableUnits <= 5) {
            return {
                variant: "secondary",
                text: `${availableUnits} left`,
                ariaLabel: `${availableUnits} rooms available`
            };
        }
        
        return {
            variant: "default",
            text: `${availableUnits} available`,
            ariaLabel: `${availableUnits} rooms available`
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
