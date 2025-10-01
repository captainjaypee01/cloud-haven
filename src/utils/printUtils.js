// utils/printUtils.js
import BookingPrintView from '@/components/admin/booking/BookingPrintView';

/**
 * Print booking details as a receipt
 * @param {Object} booking - The booking object
 * @param {Object} options - Print options
 * @param {Object} options.sections - Sections to include/exclude
 * @param {boolean} options.openInNewWindow - Whether to open in new window (default: true)
 * @param {string} options.windowName - Name for the new window
 * @param {string} options.windowFeatures - Features for the new window
 */
export const printBookingReceipt = (booking, options = {}) => {
    const {
        sections = {},
        openInNewWindow = true,
        windowName = '_blank',
        windowFeatures = 'width=800,height=600'
    } = options;

    const printContent = BookingPrintView({ booking, sections });
    
    if (openInNewWindow) {
        // Create a new window for printing
        const printWindow = window.open('', windowName, windowFeatures);
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            
            // Close the window after printing (optional)
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        };
    } else {
        // Print in current window
        const printDiv = document.createElement('div');
        printDiv.innerHTML = printContent;
        document.body.appendChild(printDiv);
        
        window.print();
        
        // Clean up
        document.body.removeChild(printDiv);
    }
};

/**
 * Get print content as HTML string (useful for email or other purposes)
 * @param {Object} booking - The booking object
 * @param {Object} sections - Sections to include/exclude
 * @returns {string} HTML content
 */
export const getBookingReceiptHTML = (booking, sections = {}) => {
    return BookingPrintView({ booking, sections });
};

/**
 * Download booking receipt as HTML file
 * @param {Object} booking - The booking object
 * @param {Object} options - Download options
 * @param {Object} options.sections - Sections to include/exclude
 * @param {string} options.filename - Filename for download (default: booking-receipt-{reference}.html)
 */
export const downloadBookingReceipt = (booking, options = {}) => {
    const {
        sections = {},
        filename = `booking-receipt-${booking.reference_number}.html`
    } = options;

    const printContent = BookingPrintView({ booking, sections });
    
    // Create blob and download
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
};

/**
 * Common section presets for different use cases
 */
export const PRINT_PRESETS = {
    // Full receipt with all sections
    FULL: {
        header: true,
        guestInfo: true,
        bookingDetails: true,
        pricing: true,
        rooms: true,
        meals: true,
        payments: true,
        cancellation: true,
        footer: true
    },
    
    // Customer receipt (excludes internal details)
    CUSTOMER: {
        header: true,
        guestInfo: true,
        bookingDetails: true,
        pricing: true,
        rooms: true,
        meals: true,
        payments: false, // Hide payment details from customer
        cancellation: true,
        footer: true
    },
    
    // Simple receipt (basic info only)
    SIMPLE: {
        header: true,
        guestInfo: true,
        bookingDetails: true,
        pricing: true,
        rooms: false,
        meals: false,
        payments: false,
        cancellation: false,
        footer: true
    },
    
    // Payment summary only
    PAYMENT_SUMMARY: {
        header: true,
        guestInfo: false,
        bookingDetails: false,
        pricing: true,
        rooms: false,
        meals: false,
        payments: true,
        cancellation: false,
        footer: true
    },
    
    // Room details only
    ROOM_DETAILS: {
        header: true,
        guestInfo: false,
        bookingDetails: false,
        pricing: false,
        rooms: true,
        meals: true,
        payments: false,
        cancellation: false,
        footer: true
    }
};

export default {
    printBookingReceipt,
    getBookingReceiptHTML,
    downloadBookingReceipt,
    PRINT_PRESETS
};
