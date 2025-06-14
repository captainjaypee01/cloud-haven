// src/hooks/useCart.js
import { useState, useEffect } from 'react';

const useCart = () => {
    const [cart, setCart] = useState({
        checkIn: null,
        checkOut: null,
        items: [],
    });

    // Initialize from localStorage
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('resort_cart'));
        if (savedCart) setCart(savedCart);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('resort_cart', JSON.stringify(cart));
    }, [cart]);

    const updateDates = (checkIn, checkOut) => {
        setCart(prev => ({ ...prev, checkIn, checkOut }));
    };

    const addToCart = (room) => {
        setCart(prev => {
            const existingIndex = prev.items.findIndex(item => item.id === room.id);

            if (existingIndex >= 0) {
                // Update existing item
                const updatedItems = [...prev.items];
                updatedItems[existingIndex].quantity += 1;
                return { ...prev, items: updatedItems };
            } else {
                // Add new item
                return {
                    ...prev,
                    items: [...prev.items, { ...room, quantity: 1 }]
                };
            }
        });
    };

    const updateQuantity = (roomId, quantity) => {
        setCart(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === roomId ? { ...item, quantity } : item
            )
        }));
    };

    const removeFromCart = (roomId) => {
        setCart(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== roomId)
        }));
    };

    const clearCart = () => {
        setCart({ checkIn: null, checkOut: null, items: [] });
    };

    return {
        cart,
        updateDates,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
    };
};

export default useCart;