/**
 * Utility functions for handling room type logic
 */

/**
 * Check if a room is Day Tour type based on room_type field
 * @param {Object} room - Room object
 * @returns {boolean} - True if room is Day Tour type
 */
export function isDayTourRoom(room) {
    // Check room_type field first (new approach)
    if (room.room_type) {
        return room.room_type === 'day_tour';
    }
    // Fallback to legacy allows_day_use flag for backward compatibility
    return room.allows_day_use === true || room.allows_day_use === 1;
}

/**
 * Check if there are any Day Tour items in cart
 * @param {Array} cartItems - Array of cart items
 * @returns {boolean} - True if cart has Day Tour items
 */
export function hasDayTourItems(cartItems) {
    return cartItems.some(item => item.roomType === 'day_tour');
}

/**
 * Check if there are any Overnight items in cart
 * @param {Array} cartItems - Array of cart items
 * @returns {boolean} - True if cart has Overnight items
 */
export function hasOvernightItems(cartItems) {
    return cartItems.some(item => {
        // Only return true if it's explicitly an overnight item
        // or if it doesn't have a roomType (legacy items are overnight)
        return item.roomType === 'overnight' || !item.roomType;
    });
}

/**
 * Validate room type mixing in cart
 * @param {Array} cartItems - Current cart items
 * @param {Object} newRoom - New room being added
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateRoomTypeMixing(cartItems, newRoom) {
    if (cartItems.length === 0) {
        return { isValid: true, error: null };
    }

    const newRoomIsDayTour = isDayTourRoom(newRoom);
    const hasExistingDayTour = hasDayTourItems(cartItems);
    const hasExistingOvernight = hasOvernightItems(cartItems);

    // If trying to add Day Tour room but cart has Overnight rooms
    if (newRoomIsDayTour && hasExistingOvernight) {
        return {
            isValid: false,
            error: 'Cannot add Day Tour rooms to cart with overnight accommodations. Day Tour and overnight bookings must be separate.'
        };
    }

    // If trying to add Overnight room but cart has Day Tour rooms
    if (!newRoomIsDayTour && hasExistingDayTour) {
        return {
            isValid: false,
            error: 'Cannot add overnight rooms to cart with Day Tour accommodations. Day Tour and overnight bookings must be separate.'
        };
    }

    return { isValid: true, error: null };
}
