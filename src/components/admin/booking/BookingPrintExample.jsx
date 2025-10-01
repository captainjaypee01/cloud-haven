// components/admin/booking/BookingPrintExample.jsx
// Example component showing different ways to use the print functionality

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText } from 'lucide-react';
import { printBookingReceipt, downloadBookingReceipt, getBookingReceiptHTML, PRINT_PRESETS } from '@/utils/printUtils';

const BookingPrintExample = ({ booking }) => {
    if (!booking) {
        return <div>No booking data available</div>;
    }

    const handleQuickPrint = () => {
        // Simple print with all sections
        printBookingReceipt(booking);
    };

    const handleCustomerReceipt = () => {
        // Print customer-friendly receipt (no payment details)
        printBookingReceipt(booking, {
            sections: PRINT_PRESETS.CUSTOMER
        });
    };

    const handleSimpleReceipt = () => {
        // Print simple receipt (basic info only)
        printBookingReceipt(booking, {
            sections: PRINT_PRESETS.SIMPLE
        });
    };

    const handleDownloadHTML = () => {
        // Download as HTML file
        downloadBookingReceipt(booking, {
            filename: `booking-receipt-${booking.reference_number}.html`
        });
    };

    const handleGetHTML = () => {
        // Get HTML content (useful for email templates, etc.)
        const htmlContent = getBookingReceiptHTML(booking, PRINT_PRESETS.CUSTOMER);
        
        // You could use this HTML for:
        // - Email templates
        // - API responses
        // - Embedding in other components
        // - Generating PDFs server-side
    };

    const handleCustomSections = () => {
        // Print with custom section selection
        printBookingReceipt(booking, {
            sections: {
                header: true,
                guestInfo: true,
                bookingDetails: true,
                pricing: true,
                rooms: true,
                meals: false, // Hide meal details
                payments: false, // Hide payment details
                cancellation: true,
                footer: true
            }
        });
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Print Functionality Examples</h3>
            <p className="text-sm text-muted-foreground">
                These examples show different ways to use the booking print functionality.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                    onClick={handleQuickPrint}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <Printer className="h-4 w-4 mr-2" />
                    Quick Print (All Sections)
                </Button>
                
                <Button
                    onClick={handleCustomerReceipt}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <Printer className="h-4 w-4 mr-2" />
                    Customer Receipt
                </Button>
                
                <Button
                    onClick={handleSimpleReceipt}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <Printer className="h-4 w-4 mr-2" />
                    Simple Receipt
                </Button>
                
                <Button
                    onClick={handleCustomSections}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <Printer className="h-4 w-4 mr-2" />
                    Custom Sections
                </Button>
                
                <Button
                    onClick={handleDownloadHTML}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download HTML
                </Button>
                
                <Button
                    onClick={handleGetHTML}
                    className="cursor-pointer"
                    variant="outline"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Get HTML (Console)
                </Button>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Note:</strong> This is an example component showing different print options. 
                In production, you would typically use the <code>BookingPrintButton</code> component 
                which provides a user-friendly dialog for selecting print options.
            </div>
        </div>
    );
};

export default BookingPrintExample;
