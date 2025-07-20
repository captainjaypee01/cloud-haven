import { useEffect, useState } from "react";

/**
 * Debounce a value for React
 * @param {any} value - The value to debounce
 * @param {number} delay - milliseconds (eg. 400)
 * @returns debouncedValue
 */
export function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounced(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}
