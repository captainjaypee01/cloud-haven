// components/admin/calendar/BookingDetailsDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { 
  User, 
  Calendar, 
  Users, 
  DollarSign, 
  CreditCard, 
  Mail,
  Phone,
  Clock,
  Home
} from 'lucide-react';

const BookingDetailsDialog = ({ open, onOpenChange, bookingData, unitInfo }) => {
  if (!bookingData) return null;

  const {
    reference_number,
    guest_name,
    guest_email,
    guest_phone,
    check_in_date,
    check_out_date,
    nights,
    adults,
    children,
    total_guests,
    room_price,
    meal_price,
    final_price,
    other_charges,
    total_payable,
    total_paid,
    remaining_balance,
    status,
    booking_type
  } = bookingData;

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      downpayment: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Booking Details - {unitInfo?.room_name} Unit {unitInfo?.unit_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Status & Reference */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {booking_type === 'day_tour' ? 'Day Tour' : 'Overnight Stay'}
              </span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-muted-foreground">
                {reference_number}
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Guest Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Name:</span>
                  <span>{guest_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{guest_email}</span>
                </div>
                {guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Phone:</span>
                    <span>{guest_phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Adults:</span>
                  <span>{adults}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Children:</span>
                  <span>{children}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Total Guests:</span>
                  <span className="font-semibold">{total_guests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Stay Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Check-in:</span>
                  <span>{formatDate(check_in_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Check-out:</span>
                  <span>{formatDate(check_out_date)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Duration:</span>
                  <span className="font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Information
            </h3>
            <div className="space-y-3 p-4 bg-green-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Room Price:</span>
                    <span className="font-medium">{formatCurrency(room_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Meal Price:</span>
                    <span className="font-medium">{formatCurrency(meal_price || 0)}</span>
                  </div>
                  {other_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other Charges:</span>
                      <span className="font-medium">{formatCurrency(other_charges)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Payable:</span>
                    <span className="font-bold text-lg">{formatCurrency(total_payable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Total Paid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(total_paid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-red-600">Remaining Balance:</span>
                    <span className="font-bold text-lg text-red-600">{formatCurrency(remaining_balance)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Status
            </h3>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Status:</span>
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              {remaining_balance > 0 && (
                <div className="mt-2 text-sm text-amber-700">
                  <strong>Note:</strong> Remaining balance of {formatCurrency(remaining_balance)} is due at the resort during check-in.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsDialog;
