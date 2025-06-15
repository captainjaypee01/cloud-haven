import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useStickyState } from '@/hooks/useStickyState';
import { toast } from 'sonner';

const CartCtx = createContext();

function reducer(state, action) {
    switch (action.type) {
        case 'SET_DATES':
            return (action.from !== state.checkIn || action.to !== state.checkOut)
                ? { ...state, checkIn: action.from, checkOut: action.to, items: [] }
                : state;
        case 'ADD':
            const addedAt = Date.now();
            const timestampId = `${action.room.roomId}-${addedAt}`;
            const newItem = { ...action.room, uniqueId: timestampId, addedAt: new Date(addedAt) };
            return { ...state, items: [...state.items, newItem] };
        case 'REMOVE':
            return { ...state, items: state.items.filter(i => i.uniqueId !== action.uniqueId) };
        case 'UPDATE':
            return {
                ...state,
                items: state.items.map(i =>
                    i.uniqueId === action.uniqueId ? { ...i, ...action.changes } : i
                ),
            };
        case 'CLEAR':
            return { checkIn: '', checkOut: '', items: [] };
        default:
            return state;
    }
}

export const CartProvider = ({ children }) => {
    const [stickyDates, setStickyDates] = useStickyState(
        { checkIn: '', checkOut: '' },
        'booking-dates'
    );
    const [state, dispatch] = useReducer(
        reducer,
        undefined,
        () => {
            const saved = localStorage.getItem("cart");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch { }
            }
            return { ...stickyDates, items: [] };
        }
    );

    // inside CartProvider:
    const updateItem = (uniqueId, changes) => {
        dispatch({ type: 'UPDATE', uniqueId, changes });

        toast.success('Cart updated'); // or toast.success
    }

    const removeItem = (uniqueId) => {
        dispatch({ type: 'REMOVE', uniqueId });
        toast.success('Removed from cart');
    }

    const addItem = room => {
        dispatch({ type: 'ADD', room });
        toast.success(`Added "${room.name}" to cart`);
    }

    // Sync the date part back to localStorage
    useEffect(() => {
        setStickyDates({ checkIn: state.checkIn, checkOut: state.checkOut });
    }, [state.checkIn, state.checkOut]);

    // Persist cart too
    useEffect(() => localStorage.setItem('cart', JSON.stringify(state)), [state]);

    return (
        <CartCtx.Provider value={{
            state, dispatch,
            updateItem,
            removeItem,
            addItem,
            clear: () => dispatch({ type: 'CLEAR' }),
        }}>
            {children}
        </CartCtx.Provider>
    );
};

export const useCart = () => useContext(CartCtx);
