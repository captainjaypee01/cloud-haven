import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

const statusVariant = (status) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'downpayment':
      return 'warning';
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};



const isBookingOnDay = (booking, dayStr) => {
  // For Day Tours, start and end are the same date
  if (booking.booking_type === 'day_tour') {
    return booking.start === dayStr;
  }
  // For overnight bookings, use the standard logic (exclude checkout day)
  return booking.start <= dayStr && dayStr < booking.end;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DayTimeline({ date, events }) {
  const dayStr = useMemo(() => formatDate(date), [date]);


  // Group bookings by booking_id to show related rooms together
  const bookingRows = useMemo(() => {
    // Filter events that occur on this day
    const dayEvents = (events || []).filter(event =>
      isBookingOnDay(event, dayStr)
    );

    // Group by booking_id
    const bookingMap = new Map();

    dayEvents.forEach(event => {
      const bookingId = event.booking_id;
      // Skip events without a valid booking_id
      if (!bookingId || bookingId === undefined || bookingId === null) return;
      
      if (!bookingMap.has(bookingId)) {
        bookingMap.set(bookingId, {
          booking_id: event.booking_id,
          reference_number: event.reference_number,
          guest_name: event.guest_name,
          status: event.status,
          start: event.start,
          end: event.end,
          nights: event.nights,
          final_price: event.final_price,
          remaining_balance: event.remaining_balance,
          booking_adults: event.booking_adults,
          booking_children: event.booking_children,
          booking_type: event.booking_type,
          rooms: []
        });
      }
      
      // Add room to the booking with Day Tour specific fields
      const roomData = {
        room_type_id: event.room_type_id,
        room_type_name: event.room_type_name,
        room_unit_id: event.room_unit_id,
        room_unit_number: event.room_unit_number,
        room_capacity: event.room_capacity,
        room_price_per_night: event.room_price_per_night,
        adults: event.adults,
        children: event.children,
        total_guests: event.total_guests
      };
      
      // Add Day Tour specific fields if they exist
      if (event.price_per_pax !== undefined) roomData.price_per_pax = event.price_per_pax;
      if (event.include_lunch !== undefined) roomData.include_lunch = event.include_lunch;
      if (event.include_pm_snack !== undefined) roomData.include_pm_snack = event.include_pm_snack;
      if (event.lunch_cost !== undefined) roomData.lunch_cost = event.lunch_cost;
      if (event.pm_snack_cost !== undefined) roomData.pm_snack_cost = event.pm_snack_cost;
      if (event.meal_cost !== undefined) roomData.meal_cost = event.meal_cost;
      if (event.base_price !== undefined) roomData.base_price = event.base_price;
      if (event.room_total_price !== undefined) roomData.room_total_price = event.room_total_price;
      
      bookingMap.get(bookingId).rooms.push(roomData);
    });

    // Convert to array and sort by guest name
    return Array.from(bookingMap.values()).sort((a, b) => 
      a.guest_name.localeCompare(b.guest_name)
    );
  }, [events, dayStr]);

  if (bookingRows.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold text-lg">Room Timeline</h3>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p>No bookings found for this date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">Room Timeline</h3>
        <p className="text-sm text-muted-foreground">
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Booking Details */}
      <div className="space-y-4">
        {bookingRows.map((booking, index) => (
          <div
            key={booking.booking_id ? `booking-${booking.booking_id}` : `booking-${index}`}
            className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
          >
            {/* Booking Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{booking.guest_name}</h4>
                    <Badge variant={statusVariant(booking.status)}>
                        {booking.status}
                    </Badge>
                    {booking.booking_type && (
                        <Badge 
                            variant="secondary" 
                            className={booking.booking_type === 'day_tour' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'}
                        >
                            {booking.booking_type === 'day_tour' ? 'Day Tour' : 'Overnight'}
                        </Badge>
                    )}
                    <span className="font-mono text-sm text-muted-foreground">
                        Ref: {booking.reference_number || 'N/A'}
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.start} → {booking.end} ({booking.booking_type === 'day_tour' ? 'Day Tour' : `${booking.nights} night${booking.nights !== 1 ? 's' : ''}`})
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">
                  {formatCurrency(booking.final_price || 0)}
                </div>
                <div className={`text-sm ${booking.remaining_balance > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}`}>
                  Balance: {formatCurrency(booking.remaining_balance || 0)}
                </div>
              </div>
            </div>

            {/* Rooms */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Rooms:</div>
              <div className="grid gap-2">
                {booking.rooms.map((room, roomIndex) => (
                  <div key={`${booking.booking_id ? `booking-${booking.booking_id}` : `booking-${index}`}-room-${roomIndex}`} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                    <div className="flex-1">
                      <div className="font-medium">
                        {room.room_type_name || 'Unknown Room'}
                        {room.room_unit_id && ` - Unit ${room.room_unit_number}`}
                        {!room.room_unit_id && ' (Unassigned)'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Capacity: {room.room_capacity} pax • {room.adults} adults, {room.children} children
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {booking.booking_type === 'day_tour' 
                          ? `${formatCurrency(room.price_per_pax || room.room_price_per_night || 0)} per pax`
                          : `${formatCurrency(room.room_price_per_night || 0)} per night`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Guests:</span>
                  <span className="ml-2 font-medium">
                    {booking.booking_adults} adults, {booking.booking_children} children
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Meals:</span>
                  <span className="ml-2 font-medium">
                    {booking.booking_adults} adults, {booking.booking_children} children
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}