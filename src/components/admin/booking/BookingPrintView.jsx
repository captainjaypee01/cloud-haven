// components/admin/booking/BookingPrintView.jsx
import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { getPaymentProviderLabel } from '@/utils/paymentUtils';

const BookingPrintView = ({ booking, sections = {} }) => {
    if (!booking) return null;

    // Default sections - all enabled by default
    const defaultSections = {
        header: true,
        guestInfo: true,
        bookingDetails: true,
        pricing: true,
        rooms: true,
        meals: true,
        payments: true,
        cancellation: true,
        footer: true
    };

    const enabledSections = { ...defaultSections, ...sections };

    // Calculate totals
    const totalPaid = booking.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const actualFinalPrice = Number(booking.final_price) - Number(booking.discount_amount || 0);
    const otherCharges = booking.other_charges || 0;
    const totalPayable = actualFinalPrice + Number(otherCharges);
    const remainingBalance = Math.max(totalPayable - totalPaid, 0);

    const printStyles = `
        <style>
            @media print {
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .no-print { display: none !important; }
                .print-break { page-break-before: always; }
                .print-avoid-break { page-break-inside: avoid; }
            }
            .print-container {
                max-width: 800px;
                margin: 0 auto;
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
            }
            .print-header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .print-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .print-subtitle {
                font-size: 16px;
                color: #666;
            }
            .print-section {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            .print-section-title {
                font-size: 18px;
                font-weight: bold;
                border-bottom: 1px solid #ccc;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            .print-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .print-grid-3 {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
            }
            .print-item {
                margin-bottom: 8px;
            }
            .print-label {
                font-weight: bold;
                display: inline-block;
                min-width: 140px;
            }
            .print-value {
                color: #333;
            }
            .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .print-table th,
            .print-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .print-table th {
                background-color: #f5f5f5;
                font-weight: bold;
            }
            .print-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .print-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .print-badge-success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .print-badge-warning {
                background-color: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .print-badge-danger {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .print-badge-info {
                background-color: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .print-badge-secondary {
                background-color: #e2e3e5;
                color: #383d41;
                border: 1px solid #d6d8db;
            }
            .print-total {
                font-size: 16px;
                font-weight: bold;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 15px;
            }
            .print-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            .print-amount {
                font-weight: bold;
                color: #2c5530;
            }
            .print-amount-negative {
                color: #dc3545;
            }
            .print-meal-detail {
                font-size: 12px;
                margin-left: 10px;
            }
            .print-meal-item {
                margin-bottom: 3px;
            }
            .print-meal-cost {
                font-weight: bold;
                color: #28a745;
            }
        </style>
    `;

    const getStatusBadge = (status) => {
        const badges = {
            'confirmed': { class: 'print-badge-success', text: 'Confirmed' },
            'pending': { class: 'print-badge-warning', text: 'Pending' },
            'cancelled': { class: 'print-badge-danger', text: 'Cancelled' },
            'failed': { class: 'print-badge-danger', text: 'Failed' },
            'paid': { class: 'print-badge-success', text: 'Paid' },
            'unpaid': { class: 'print-badge-warning', text: 'Unpaid' }
        };
        const badge = badges[status] || { class: 'print-badge-secondary', text: status };
        return `<span class="print-badge ${badge.class}">${badge.text}</span>`;
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            'paid': { class: 'print-badge-success', text: 'Paid' },
            'pending': { class: 'print-badge-warning', text: 'Pending' },
            'failed': { class: 'print-badge-danger', text: 'Failed' },
            'cancelled': { class: 'print-badge-danger', text: 'Cancelled' }
        };
        const badge = badges[status] || { class: 'print-badge-secondary', text: status };
        return `<span class="print-badge ${badge.class}">${badge.text}</span>`;
    };

    const getProofStatusBadge = (proofStatus, uploadCount = 0) => {
        if (!proofStatus || proofStatus === 'none') {
            return `<span style="font-size: 12px; color: #666;">${uploadCount}/3</span>`;
        }
        
        const badges = {
            'pending': { class: 'print-badge-warning', text: `Under Review (${uploadCount}/3)` },
            'accepted': { class: 'print-badge-success', text: `Accepted (${uploadCount}/3)` },
            'rejected': { class: 'print-badge-danger', text: `Rejected (${uploadCount}/3)` }
        };
        const badge = badges[proofStatus] || { class: 'print-badge-secondary', text: `${uploadCount}/3` };
        return `<span class="print-badge ${badge.class}">${badge.text}</span>`;
    };

    const renderHeader = () => {
        if (!enabledSections.header) return '';
        
        return `
            <div class="print-section">
                <div class="print-header">
                    <div class="print-title">BOOKING RECEIPT</div>
                    <div class="print-subtitle">Netania De Laiya</div>
                    <div style="margin-top: 10px;">
                        ${booking.booking_type === 'day_tour' ? 
                            '<span class="print-badge print-badge-info">Day Tour</span>' : 
                            '<span class="print-badge print-badge-info">Overnight Stay</span>'
                        }
                    </div>
                </div>
            </div>
        `;
    };

    const renderGuestInfo = () => {
        if (!enabledSections.guestInfo) return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title">Guest Information</div>
                <div class="print-grid">
                    <div>
                        <div class="print-item">
                            <span class="print-label">Guest Name:</span>
                            <span class="print-value">${booking.guest_name}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Email:</span>
                            <span class="print-value">${booking.guest_email}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Phone:</span>
                            <span class="print-value">${booking.guest_phone}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">User ID:</span>
                            <span class="print-value">${booking.user_id || '-'}</span>
                        </div>
                    </div>
                    <div>
                        <div class="print-item">
                            <span class="print-label">Adults:</span>
                            <span class="print-value">${booking.adults}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Children:</span>
                            <span class="print-value">${booking.children}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Total Guests:</span>
                            <span class="print-value">${booking.total_guests}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Special Requests:</span>
                            <span class="print-value">${booking.special_requests || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderBookingDetails = () => {
        if (!enabledSections.bookingDetails) return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title">Booking Details</div>
                <div class="print-grid">
                    <div>
                        <div class="print-item">
                            <span class="print-label">Reference Number:</span>
                            <span class="print-value" style="font-weight: bold; font-size: 16px;">#${booking.reference_number}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Status:</span>
                            <span class="print-value">${getStatusBadge(booking.status)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Booked At:</span>
                            <span class="print-value">${formatDateTime(booking.local_created_at)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Reserved Until:</span>
                            <span class="print-value">${booking.local_reserved_until ? formatDateTime(booking.local_reserved_until) : '-'}</span>
                        </div>
                    </div>
                    <div>
                        ${booking.booking_type === 'day_tour' ? `
                            <div class="print-item">
                                <span class="print-label">Day Tour Date:</span>
                                <span class="print-value">${formatDate(booking.check_in_date)}</span>
                            </div>
                            <div class="print-item">
                                <span class="print-label">Tour Hours:</span>
                                <span class="print-value">8:00 AM - 5:00 PM</span>
                            </div>
                        ` : `
                            <div class="print-item">
                                <span class="print-label">Check-in:</span>
                                <span class="print-value">${formatDate(booking.check_in_date)}</span>
                            </div>
                            <div class="print-item">
                                <span class="print-label">Check-out:</span>
                                <span class="print-value">${formatDate(booking.check_out_date)}</span>
                            </div>
                        `}
                        <div class="print-item">
                            <span class="print-label">Payment Option:</span>
                            <span class="print-value">${booking.payment_option?.toUpperCase() || '-'}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Downpayment Amount:</span>
                            <span class="print-value print-amount">${formatCurrency(booking.downpayment_amount)}</span>
                        </div>
                    </div>
                </div>
                ${booking.promo ? `
                    <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                        <div class="print-item">
                            <span class="print-label">Promo Used:</span>
                            <span class="print-value">
                                <span class="print-badge print-badge-secondary">${booking.promo.code}</span>
                                <span style="margin-left: 10px;">
                                    ${booking.promo.discount_type === 'percentage' 
                                        ? `${booking.promo.discount_value}% off` 
                                        : `${formatCurrency(booking.promo.discount_value)} off`
                                    }
                                </span>
                            </span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Promo Title:</span>
                            <span class="print-value">${booking.promo.title}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };

    const renderPricing = () => {
        if (!enabledSections.pricing) return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title">Price Breakdown</div>
                <div class="print-grid-3">
                    <div>
                        <div class="print-item">
                            <span class="print-label">Room Price:</span>
                            <span class="print-value">${formatCurrency(booking.total_price)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Meal Price:</span>
                            <span class="print-value">${formatCurrency(booking.meal_price || 0)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Extra Guest Fee:</span>
                            <span class="print-value">${formatCurrency(booking.extra_guest_fee || 0)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="print-item">
                            <span class="print-label">Discount:</span>
                            <span class="print-value print-amount-negative">-${formatCurrency(booking.discount_amount)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Other Charges:</span>
                            <span class="print-value">${formatCurrency(otherCharges)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Total Paid:</span>
                            <span class="print-value print-amount">${formatCurrency(totalPaid)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="print-item">
                            <span class="print-label">Total Payable:</span>
                            <span class="print-value print-amount">${formatCurrency(totalPayable)}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Remaining Balance:</span>
                            <span class="print-value print-amount">${formatCurrency(remainingBalance)}</span>
                        </div>
                    </div>
                </div>
                ${booking.other_charges_list && Array.isArray(booking.other_charges_list) && booking.other_charges_list.length > 0 ? `
                    <div style="margin-top: 15px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Other Charges Details:</div>
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Remarks</th>
                                    <th>Date Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${booking.other_charges_list.map((c, idx) => `
                                    <tr>
                                        <td>${formatCurrency(c.amount)}</td>
                                        <td>${c.remarks || '-'}</td>
                                        <td>${formatDateTime(c.created_at)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;
    };

    const renderRooms = () => {
        if (!enabledSections.rooms || !booking.booking_rooms) return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title">Room Details</div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Room Unit</th>
                            <th>${booking.booking_type === 'day_tour' ? 'Price/Person' : 'Price/Night'}</th>
                            <th>Adults</th>
                            <th>Children</th>
                            <th>Total Guests</th>
                            ${booking.booking_type === 'day_tour' ? '<th>Base Price</th><th>Meal Cost</th><th>Total Price</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${booking.booking_rooms.map((br, idx) => `
                            <tr>
                                <td>${br.room?.name || ''}</td>
                                <td>${br.room_unit ? br.room_unit.unit_number : 'TBD'}</td>
                                <td>${booking.booking_type === 'day_tour' ? 
                                    formatCurrency((br.base_price || 0) / (br.total_guests || 1)) :
                                    formatCurrency(br.price_per_night)
                                }</td>
                                <td>${br.adults}</td>
                                <td>${br.children}</td>
                                <td>${br.total_guests}</td>
                                ${booking.booking_type === 'day_tour' ? `
                                    <td>${formatCurrency(br.base_price || 0)}</td>
                                    <td>
                                        <div class="print-meal-detail">
                                            ${br.include_lunch ? `<div class="print-meal-item">Lunch: <span class="print-meal-cost">${formatCurrency(br.lunch_cost || 0)}</span></div>` : ''}
                                            ${br.include_pm_snack ? `<div class="print-meal-item">PM Snack: <span class="print-meal-cost">${formatCurrency(br.pm_snack_cost || 0)}</span></div>` : ''}
                                            ${br.include_dinner ? `<div class="print-meal-item">Dinner: <span class="print-meal-cost">${formatCurrency(br.dinner_cost || 0)}</span></div>` : ''}
                                            ${!br.include_lunch && !br.include_pm_snack && !br.include_dinner ? '<div class="print-meal-item" style="color: #666; font-style: italic;">No meals selected</div>' : ''}
                                            ${(br.include_lunch || br.include_pm_snack || br.include_dinner) ? `<div class="print-meal-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 3px; margin-top: 3px;">Total: ${formatCurrency(br.meal_cost || 0)}</div>` : ''}
                                        </div>
                                    </td>
                                    <td style="font-weight: bold;">${formatCurrency(br.total_price || 0)}</td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderMeals = () => {
        if (!enabledSections.meals) return '';
        
        if (booking.booking_type === 'day_tour') {
            // Day Tour meals are already shown in rooms section
            return '';
        }
        
        return `
            <div class="print-section">
                <div class="print-section-title">Meal Information</div>
                ${booking.meal_quote_data?.nights ? `
                    <div class="print-grid-3" style="margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background-color: #e3f2fd; border-radius: 4px;">
                            <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${booking.meal_quote_data.buffet_nights || 0}</div>
                            <div style="font-size: 12px; color: #666;">Buffet Nights</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background-color: #e8f5e8; border-radius: 4px;">
                            <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${booking.meal_quote_data.free_breakfast_nights || 0}</div>
                            <div style="font-size: 12px; color: #666;">Free Breakfast Nights</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background-color: #fff3e0; border-radius: 4px;">
                            <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${booking.extra_guest_count || 0}</div>
                            <div style="font-size: 12px; color: #666;">Extra Guests</div>
                        </div>
                    </div>
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Meal Type</th>
                                <th>Guest Breakdown</th>
                                <th>Pricing</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${booking.meal_quote_data.nights.map((night, idx) => {
                                const roomMaxGuests = booking.booking_rooms?.[0]?.room?.max_guests || 6;
                                const totalGuests = booking.total_guests;
                                const extraGuests = Math.max(0, totalGuests - roomMaxGuests);
                                
                                return `
                                    <tr>
                                        <td>${formatDate(night.date)}</td>
                                        <td>
                                            <span class="print-badge ${night.type === 'buffet' ? 'print-badge-info' : 'print-badge-success'}">
                                                ${night.type === 'buffet' ? 'Buffet' : 'Free Breakfast'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="font-size: 12px;">
                                                <div><strong>${totalGuests} Total Guests</strong></div>
                                                ${night.type === 'buffet' ? `
                                                    <div>• All guests pay buffet price</div>
                                                    ${extraGuests > 0 ? `<div>• ${extraGuests} extra guests: Additional entrance/amenity fee</div>` : ''}
                                                ` : `
                                                    <div>• ${roomMaxGuests} guests: Free breakfast + amenities</div>
                                                    ${extraGuests > 0 ? `<div>• ${extraGuests} extra guests: All-inclusive fee (breakfast + entrance + amenities)</div>` : ''}
                                                `}
                                            </div>
                                        </td>
                                        <td>
                                            <div style="font-size: 12px;">
                                                ${night.type === 'buffet' ? `
                                                    <div>Buffet - Adult: ${formatCurrency(night.adult_price || 0)}</div>
                                                    <div>Buffet - Child: ${formatCurrency(night.child_price || 0)}</div>
                                                    ${extraGuests > 0 ? `<div style="color: #f57c00;">Extra guest fee: ${formatCurrency(night.extra_guest_fee || 0)}</div>` : ''}
                                                ` : `
                                                    <div>Free breakfast: ${roomMaxGuests} guests</div>
                                                    ${extraGuests > 0 ? `<div style="color: #f57c00;">All-inclusive fee: ${formatCurrency(night.extra_guest_fee || 0)}</div>` : ''}
                                                `}
                                            </div>
                                        </td>
                                        <td>
                                            <div style="font-size: 12px;">
                                                ${night.type === 'buffet' ? `
                                                    <div>Buffet: ${formatCurrency((booking.adults * (night.adult_price || 0)) + (booking.children * (night.child_price || 0)))}</div>
                                                    ${extraGuests > 0 ? `<div style="color: #f57c00;">Extra fee: ${formatCurrency(extraGuests * (night.extra_guest_fee || 0))}</div>` : ''}
                                                ` : `
                                                    <div style="color: #388e3c;">Free: ${formatCurrency(0)}</div>
                                                    ${extraGuests > 0 ? `<div style="color: #f57c00;">All-inclusive: ${formatCurrency(extraGuests * (night.extra_guest_fee || 0))}</div>` : ''}
                                                `}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ${booking.extra_guest_fee > 0 ? `
                        <div style="margin-top: 15px; padding: 15px; background-color: #fff3e0; border: 1px solid #ffb74d; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: #e65100;">Extra Guest Fees (Buffet Days)</div>
                                    <div style="font-size: 12px; color: #f57c00;">
                                        ${booking.extra_guest_count} extra guest${booking.extra_guest_count > 1 ? 's' : ''} - entrance fee, amenities, and additional services
                                    </div>
                                </div>
                                <div style="font-weight: bold; color: #e65100; font-size: 16px;">
                                    ${formatCurrency(booking.extra_guest_fee)}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                ` : `
                    <div style="padding: 15px; background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 4px;">
                        <div style="font-size: 12px; color: #1976d2; margin-bottom: 10px;">
                            <strong>Legacy Booking:</strong> Meals calculated based on meal program settings at time of booking
                        </div>
                        <div class="print-grid">
                            <div>
                                <div style="font-weight: bold; color: #1565c0;">Meal Information:</div>
                                <div style="font-size: 12px; color: #1976d2;">
                                    • Meals calculated using meal program pricing<br/>
                                    • Based on booking dates and guest count<br/>
                                    • Check meal program settings for details
                                </div>
                            </div>
                            <div>
                                <div style="font-weight: bold; color: #1565c0;">Total Meal Cost:</div>
                                <div style="font-size: 20px; font-weight: bold; color: #1976d2;">
                                    ${formatCurrency(booking.meal_price || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
    };

    const renderPayments = () => {
        if (!enabledSections.payments || !booking.payments) return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title">Payment History</div>
                ${booking.payments.length === 0 ? `
                    <div style="text-align: center; padding: 20px; color: #666; font-style: italic;">
                        No payments recorded.
                    </div>
                ` : `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Provider</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Transaction ID</th>
                                <th>Proof Status</th>
                                <th>Error Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${booking.payments.map((p, idx) => `
                                <tr>
                                    <td>${formatDateTime(p.created_at)}</td>
                                    <td>${getPaymentProviderLabel(p.provider)}</td>
                                    <td class="print-amount">${formatCurrency(p.amount)}</td>
                                    <td>${getPaymentStatusBadge(p.status)}</td>
                                    <td>${p.transaction_id || '-'}</td>
                                    <td>${getProofStatusBadge(p.proof_status, p.proof_upload_count)}</td>
                                    <td>
                                        ${p.error_code || p.error_message ? `
                                            <div style="font-size: 11px;">
                                                ${p.error_code ? `<div><strong>Code:</strong> ${p.error_code}</div>` : ''}
                                                ${p.error_message ? `<div><strong>Message:</strong> ${p.error_message}</div>` : ''}
                                            </div>
                                        ` : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
    };

    const renderCancellation = () => {
        if (!enabledSections.cancellation || booking.status !== 'cancelled') return '';
        
        return `
            <div class="print-section">
                <div class="print-section-title" style="color: #dc3545;">Cancellation Details</div>
                <div class="print-grid">
                    <div>
                        <div class="print-item">
                            <span class="print-label">Cancelled At:</span>
                            <span class="print-value">${booking.cancelled_at ? formatDateTime(booking.local_cancelled_at || booking.cancelled_at) : '-'}</span>
                        </div>
                        <div class="print-item">
                            <span class="print-label">Cancelled By:</span>
                            <span class="print-value">${booking.cancelled_by_name || (booking.cancelled_by ? 'Admin Staff' : 'System')}</span>
                        </div>
                    </div>
                    <div>
                        ${booking.cancellation_reason ? `
                            <div class="print-item">
                                <span class="print-label">Reason:</span>
                                <div style="margin-top: 5px; padding: 10px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; font-size: 12px;">
                                    ${booking.cancellation_reason}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    const renderFooter = () => {
        if (!enabledSections.footer) return '';
        
        return `
            <div class="print-footer">
                <div>Generated on ${formatDateTime(new Date())}</div>
                <div style="margin-top: 5px;">
                    Netania De Laiya | For inquiries, please contact our customer service
                </div>
            </div>
        `;
    };

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Booking Receipt - ${booking.reference_number}</title>
            ${printStyles}
        </head>
        <body>
            <div class="print-container">
                ${renderHeader()}
                ${renderGuestInfo()}
                ${renderBookingDetails()}
                ${renderPricing()}
                ${renderRooms()}
                ${renderMeals()}
                ${renderPayments()}
                ${renderCancellation()}
                ${renderFooter()}
            </div>
        </body>
        </html>
    `;

    return printContent;
};

export default BookingPrintView;
