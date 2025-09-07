import React, { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  return booking.start <= dayStr && dayStr < booking.end;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DayTable({ date, events }) {
  const dayStr = useMemo(() => formatDate(date), [date]);
  
  // Group events by booking_id to remove duplicates and show related rooms
  const dayBookings = useMemo(() => {
    const filteredEvents = (events || []).filter(event => isBookingOnDay(event, dayStr));
    
    // Group by booking_id
    const bookingMap = new Map();
    
    filteredEvents.forEach(event => {
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
          total_price: event.total_price,
          final_price: event.final_price,
          remaining_balance: event.remaining_balance,
          booking_adults: event.booking_adults,
          booking_children: event.booking_children,
          booking_total_guests: event.booking_total_guests,
          rooms: []
        });
      }
      
      // Add room to the booking
      bookingMap.get(bookingId).rooms.push({
        room_type_id: event.room_type_id,
        room_type_name: event.room_type_name,
        room_unit_id: event.room_unit_id,
        room_unit_number: event.room_unit_number,
        room_capacity: event.room_capacity,
        room_price_per_night: event.room_price_per_night,
        adults: event.adults,
        children: event.children,
        total_guests: event.total_guests
      });
    });
    
    // Convert to array and sort by guest name
    return Array.from(bookingMap.values()).sort((a, b) => 
      a.guest_name.localeCompare(b.guest_name)
    );
  }, [events, dayStr]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-lg">Bookings Table</h3>
        <p className="text-sm text-muted-foreground">
          {date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Rooms</TableHead>
              <TableHead className="w-[150px]">Guest</TableHead>
              <TableHead className="w-[120px]">Reference</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Guests</TableHead>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead className="w-[100px]">Balance</TableHead>
              <TableHead className="w-[100px]">Meals</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dayBookings.length > 0 ? (
              dayBookings.map((booking, index) => (
                <TableRow key={booking.booking_id ? `booking-${booking.booking_id}` : `booking-${index}`} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="space-y-2">
                      {booking.rooms.map((room, roomIndex) => (
                        <div key={`${booking.booking_id ? `booking-${booking.booking_id}` : `booking-${index}`}-room-${roomIndex}`} className="border-l-2 border-primary/20 pl-2">
                          <div className="font-semibold text-sm">
                            {room.room_type_name || 'Unknown Room'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {room.room_unit_id ? `Unit ${room.room_unit_number}` : 'Unassigned'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Capacity: {room.room_capacity} pax • ₱{room.room_price_per_night?.toLocaleString() || '0'}/night
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {room.adults} adults, {room.children} children
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium text-sm">
                      {booking.guest_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.start} → {booking.end}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-mono text-sm">
                      {booking.reference_number || 'N/A'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={statusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                      {booking.booking_type && (
                        <Badge 
                          variant="outline" 
                          className={booking.booking_type === 'day_tour' ? 'border-amber-600 text-amber-600' : 'border-blue-600 text-blue-600'}
                        >
                          {booking.booking_type === 'day_tour' ? 'Day Tour' : 'Overnight'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    <div>{booking.booking_adults} adults</div>
                    <div className="text-muted-foreground">{booking.booking_children} children</div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    <div>₱{booking.final_price?.toLocaleString() || '0'}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    <div className={booking.remaining_balance > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                      ₱{booking.remaining_balance?.toLocaleString() || '0'}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    <div>{booking.booking_adults} adults</div>
                    <div className="text-muted-foreground">{booking.booking_children} children</div>
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        // Navigate to booking details
                        window.open(`/admin/bookings/${booking.booking_id}`, '_blank');
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={9} 
                  className="text-center text-muted-foreground py-8"
                >
                  No bookings found for this date.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary */}
      {dayBookings.length > 0 && (
        <div className="p-4 border-t bg-muted/10">
          <div className="text-sm text-muted-foreground">
            Total bookings for this day: <span className="font-semibold">{dayBookings.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}