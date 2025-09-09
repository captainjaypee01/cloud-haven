// src/hooks/useStickyState.js
import { useState, useEffect } from 'react';

export function useStickyState(initial, key) {
    const [value, setValue] = useState(() => {
        const sticky = typeof window !== 'undefined' && localStorage.getItem(key);
        return sticky ? JSON.parse(sticky) : initial;
    });

    useEffect(() => {
        if (value) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.removeItem(key);
        }
    }, [key, value]);

    return [value, setValue];
}
