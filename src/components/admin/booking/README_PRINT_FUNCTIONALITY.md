# Booking Print Functionality

This document describes the booking print functionality that allows admin staff to generate professional receipts for customers at Netania De Laiya.

## Components

### 1. BookingPrintView.jsx
The main component that generates the HTML content for printing. It creates a professional, print-optimized layout with all booking details.

**Features:**
- Responsive print layout
- Professional styling
- Section-based organization
- Support for both Day Tour and Overnight bookings
- Detailed meal breakdowns
- Payment history
- Cancellation details

### 2. BookingPrintButton.jsx
A user-friendly button component that provides a dialog for customizing print options.

**Features:**
- Quick preset selection (Full, Customer, Simple, Payment Summary, Room Details)
- Individual section customization
- Print to new window
- Download as HTML file
- Professional UI with checkboxes and dropdowns

### 3. printUtils.js
Utility functions for programmatic access to print functionality.

**Functions:**
- `printBookingReceipt(booking, options)` - Print booking receipt
- `getBookingReceiptHTML(booking, sections)` - Get HTML content as string
- `downloadBookingReceipt(booking, options)` - Download as HTML file
- `PRINT_PRESETS` - Predefined section combinations

## Usage Examples

### Basic Usage (Button Component)
```jsx
import BookingPrintButton from '@/components/admin/booking/BookingPrintButton';

// In your component
<BookingPrintButton 
    booking={booking}
    className="cursor-pointer"
    variant="outline"
/>
```

### Programmatic Usage
```jsx
import { printBookingReceipt, PRINT_PRESETS } from '@/utils/printUtils';

// Print with default settings
printBookingReceipt(booking);

// Print with custom sections
printBookingReceipt(booking, {
    sections: {
        header: true,
        guestInfo: true,
        pricing: true,
        rooms: false,
        meals: false,
        payments: false
    }
});

// Print using preset
printBookingReceipt(booking, {
    sections: PRINT_PRESETS.CUSTOMER
});
```

### Download as HTML
```jsx
import { downloadBookingReceipt } from '@/utils/printUtils';

downloadBookingReceipt(booking, {
    filename: `receipt-${booking.reference_number}.html`
});
```

## Available Sections

1. **header** - Booking title, Netania De Laiya resort name, booking type badge (Day Tour/Overnight Stay)
2. **guestInfo** - Guest name, email, phone, guest count, special requests
3. **bookingDetails** - Reference number, status, dates, payment option, promo info
4. **pricing** - Price breakdown, discounts, other charges, totals
5. **rooms** - Room details, units, pricing, meal selections (for Day Tours)
6. **meals** - Detailed meal breakdown (for Overnight bookings)
7. **payments** - Payment history, transaction details, proof status
8. **cancellation** - Cancellation details (only shown if booking is cancelled)
9. **footer** - Generation timestamp, Netania De Laiya contact info

## Print Presets

### FULL
All sections included - complete booking details

### CUSTOMER
Customer-friendly receipt without payment details (hides payment history)

### SIMPLE
Basic information only - header, guest info, booking details, pricing, footer

### PAYMENT_SUMMARY
Payment-focused - header, pricing, payments, footer

### ROOM_DETAILS
Room and meal information - header, rooms, meals, footer

## Styling

The print view uses CSS optimized for printing:
- Clean, professional layout
- Proper page breaks
- Print-friendly colors
- Responsive grid layouts
- Professional typography

## Integration

The print button is already integrated into the `BookingDetailsContent.jsx` component and appears in the action buttons section alongside Calendar View, Cancel, and Delete buttons.

## Customization

### Adding New Sections
1. Add the section to the `BookingPrintView.jsx` component
2. Update the `sections` object in `BookingPrintButton.jsx`
3. Add the section to `PRINT_PRESETS` in `printUtils.js`

### Modifying Styling
Edit the CSS in the `printStyles` variable in `BookingPrintView.jsx`

### Adding New Presets
Add new preset objects to `PRINT_PRESETS` in `printUtils.js`

## Browser Compatibility

- Modern browsers with print support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (with print functionality)

## Notes

- The print functionality opens in a new window for better user experience
- HTML files can be saved and shared via email
- Print dialog allows saving as PDF
- All currency formatting uses Philippine Peso (₱)
- Dates are formatted for Philippine locale
- Timezone handling follows the project's Asia/Singapore/Manila timezone settings
- Resort name displays as "Netania De Laiya" in all printed receipts
- Booking source information (Walk-in/Online) is not included in printed receipts
