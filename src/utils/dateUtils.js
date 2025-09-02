/**
 * Date utility functions for handling timezone conversion
 * Converts UTC dates to Asia/Singapore timezone (+8)
 */

/**
 * Convert UTC date to Asia/Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @returns {Date} Date in Asia/Singapore timezone
 */
export const convertToSingaporeTime = (date) => {
    if (!date) return null;
    
    try {
        const utcDate = new Date(date);
        if (isNaN(utcDate.getTime())) return null;
        
        // Convert to Singapore timezone (+8)
        const singaporeOffset = 8 * 60; // 8 hours in minutes
        const utcOffset = utcDate.getTimezoneOffset();
        const singaporeTime = new Date(utcDate.getTime() + (utcOffset + singaporeOffset) * 60000);
        
        return singaporeTime;
    } catch (error) {
        console.error('Error converting date to Singapore time:', error);
        return null;
    }
};

/**
 * Format date for display in Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatSingaporeDate = (date, options = {}) => {
    const singaporeDate = convertToSingaporeTime(date);
    if (!singaporeDate) return '—';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    
    try {
        return singaporeDate.toLocaleDateString('en-SG', defaultOptions);
    } catch (error) {
        console.error('Error formatting Singapore date:', error);
        return '—';
    }
};

/**
 * Format date and time for display in Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date and time string
 */
export const formatSingaporeDateTime = (date, options = {}) => {
    const singaporeDate = convertToSingaporeTime(date);
    if (!singaporeDate) return '—';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };
    
    try {
        return singaporeDate.toLocaleDateString('en-SG', defaultOptions);
    } catch (error) {
        console.error('Error formatting Singapore date time:', error);
        return '—';
    }
};

/**
 * Get relative time (e.g., "2 hours ago") in Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeSingaporeTime = (date) => {
    const singaporeDate = convertToSingaporeTime(date);
    if (!singaporeDate) return '—';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - singaporeDate) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : ''} ago`;
    
    return formatSingaporeDate(date);
};

/**
 * Check if a date is today in Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @returns {boolean} True if date is today
 */
export const isTodayInSingapore = (date) => {
    const singaporeDate = convertToSingaporeTime(date);
    if (!singaporeDate) return false;
    
    const today = new Date();
    const singaporeToday = convertToSingaporeTime(today);
    
    return singaporeDate.toDateString() === singaporeToday.toDateString();
};

/**
 * Check if a date is yesterday in Singapore timezone
 * @param {string|Date} date - UTC date string or Date object
 * @returns {boolean} True if date is yesterday
 */
export const isYesterdayInSingapore = (date) => {
    const singaporeDate = convertToSingaporeTime(date);
    if (!singaporeDate) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const singaporeYesterday = convertToSingaporeTime(yesterday);
    
    return singaporeDate.toDateString() === singaporeYesterday.toDateString();
};
