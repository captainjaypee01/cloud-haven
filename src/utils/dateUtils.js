import { format, addDays, parseISO, differenceInDays } from 'date-fns';

/**
 * Format buffet date range - showing meal date to next day
 * Buffet spans from meal date (dinner) to next day (breakfast/lunch)
 * @param {string} mealDate - The actual meal date from API (YYYY-MM-DD)
 * @returns {string} Formatted buffet date range string
 */
export const formatBuffetDate = (mealDate) => {
    try {
        const mealDateObj = parseISO(mealDate);
        const nextDay = addDays(mealDateObj, 1);
        
        // Format: "Oct 4 (Sat) - 5 (Sun)" or "Oct 31 (Fri) - Nov 1 (Sat)"
        const mealDateStr = format(mealDateObj, 'MMM d (EEE)');
        const nextDayStr = format(nextDay, 'd (EEE)');
        
        return `${mealDateStr} - ${nextDayStr}`;
    } catch (error) {
        console.error('Error formatting buffet date:', error);
        return '';
    }
};

/**
 * Format buffet dates for summary display - showing date ranges
 * @param {Array} buffetNights - Array of buffet night objects
 * @returns {string} Formatted buffet date ranges string
 */
export const formatBuffetSummaryDates = (buffetNights) => {
    if (!buffetNights || buffetNights.length === 0) return '';
    
    try {
        const dateRanges = buffetNights.map(night => {
            const mealDateObj = parseISO(night.date);
            const nextDay = addDays(mealDateObj, 1);
            
            // Format: "Oct 4-5" or "Oct 31-Nov 1"
            const mealDateStr = format(mealDateObj, 'MMM d');
            const nextDayStr = format(nextDay, 'd');
            
            return `${mealDateStr}-${nextDayStr}`;
        });
        
        // If multiple date ranges, join with comma
        return dateRanges.join(', ');
    } catch (error) {
        console.error('Error formatting buffet summary dates:', error);
        return '';
    }
};

/**
 * Format buffet date ranges for extra guest fees - showing date ranges
 * @param {Array} buffetNights - Array of buffet night objects
 * @returns {string} Formatted buffet date range string
 */
export const formatBuffetExtraGuestDates = (buffetNights) => {
    if (!buffetNights || buffetNights.length === 0) return '';
    
    try {
        const dateRanges = buffetNights.map(night => {
            const mealDateObj = parseISO(night.date);
            const nextDay = addDays(mealDateObj, 1);
            
            // Format: "Oct 4 (Sat) - 5 (Sun)" or "Oct 31 (Fri) - Nov 1 (Sat)"
            const mealDateStr = format(mealDateObj, 'MMM d (EEE)');
            const nextDayStr = format(nextDay, 'd (EEE)');
            
            return `${mealDateStr} - ${nextDayStr}`;
        });
        
        // If multiple date ranges, join with comma
        return dateRanges.join(', ');
    } catch (error) {
        console.error('Error formatting buffet extra guest dates:', error);
        return '';
    }
};

/**
 * Format a single meal date consistently - showing date with weekday
 * @param {string} date - The date string (YYYY-MM-DD)
 * @returns {string} Formatted date string like "Oct 4 (Sat)"
 */
export const formatMealDate = (date) => {
    try {
        const dateObj = parseISO(date);
        return format(dateObj, 'MMM d (EEE)');
    } catch (error) {
        console.error('Error formatting meal date:', error);
        return '';
    }
};

/**
 * Format buffet date range consistently - showing date range with weekdays
 * @param {string} startDate - The start date string (YYYY-MM-DD)
 * @param {string} endDate - The end date string (YYYY-MM-DD)
 * @returns {string} Formatted date range string like "Oct 4 (Sat) - 5 (Sun)"
 */
export const formatBuffetDateRange = (startDate, endDate) => {
    try {
        const startDateObj = parseISO(startDate);
        const endDateObj = parseISO(endDate);
        
        // Format: "Oct 4 (Sat) - 5 (Sun)" or "Oct 31 (Fri) - Nov 1 (Sat)"
        const startStr = format(startDateObj, 'MMM d (EEE)');
        const endStr = format(endDateObj, 'd (EEE)');
        
        return `${startStr} - ${endStr}`;
    } catch (error) {
        console.error('Error formatting buffet date range:', error);
        return '';
    }
};

/**
 * Get meal labels for buffet dates - showing what meals are included
 * @param {string} startDate - The start date string (YYYY-MM-DD)
 * @param {string} endDate - The end date string (YYYY-MM-DD)
 * @returns {string} Formatted meal labels like "Dinner, Breakfast, Lunch"
 */
export const getBuffetMealLabels = (startDate, endDate) => {
    try {
        const startDateObj = parseISO(startDate);
        const endDateObj = parseISO(endDate);
        
        // If it's the same day, it's just dinner
        if (startDateObj.getTime() === endDateObj.getTime()) {
            return 'Dinner';
        }
        
        // If it spans to the next day, it includes dinner, breakfast, and lunch
        const nextDay = addDays(startDateObj, 1);
        if (endDateObj.getTime() === nextDay.getTime()) {
            return 'Dinner, Breakfast, Lunch';
        }
        
        // For longer periods, show the range
        return 'Multi-day Buffet';
    } catch (error) {
        console.error('Error getting buffet meal labels:', error);
        return 'Buffet';
    }
};

/**
 * Format buffet date range with meal labels - mobile friendly
 * @param {string} startDate - The start date string (YYYY-MM-DD)
 * @param {string} endDate - The end date string (YYYY-MM-DD)
 * @param {boolean} isMobile - Whether to use mobile-friendly format
 * @returns {string} Formatted date range with meal labels
 */
export const formatBuffetDateRangeWithLabels = (startDate, endDate, isMobile = false) => {
    try {
        const dateRange = formatBuffetDateRange(startDate, endDate);
        const mealLabels = getBuffetMealLabels(startDate, endDate);
        
        if (isMobile) {
            // Mobile: Stack date and meals on separate lines
            return `${dateRange}\n${mealLabels}`;
        } else {
            // Desktop: Show date and meals on same line
            return `${dateRange} - ${mealLabels}`;
        }
    } catch (error) {
        console.error('Error formatting buffet date range with labels:', error);
        return '';
    }
};

/**
 * Format date and time in Singapore timezone
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string in Singapore timezone
 */
export const formatSingaporeDateTime = (date) => {
    try {
        if (!date) return '-';
        
        // Create date object and format with date and time
        const dateObj = new Date(date);
        
        // Format with date and time (will use local timezone)
        return format(dateObj, 'MMM d, yyyy h:mm a');
    } catch (error) {
        console.error('Error formatting Singapore date time:', error);
        return '-';
    }
};