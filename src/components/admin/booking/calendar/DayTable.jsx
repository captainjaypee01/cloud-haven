import React, { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// Helper function to get meal information per room
const getMealInfoPerRoom = (booking, room) => {
  const bookingType = booking.booking_type || 'overnight';
  
  if (bookingType === 'day_tour') {
    // For Day Tours, use the actual booking_rooms data from the API
    const mealCost = room.meal_cost || 0;
    const includeLunch = room.include_lunch || false;
    const includePmSnack = room.include_pm_snack || false;
    
    // Build details based on what's included
    let details = [];
    if (includeLunch) details.push('Lunch');
    if (includePmSnack) details.push('PM Snack');
    if (details.length === 0) details.push('No meals');
    
    return {
      type: 'Day Tour Meals',
      cost: mealCost,
      details: details.join(', ')
    };
  } else {
    const mealQuoteData = booking.meal_quote_data || {};
    // For overnight bookings, check meal program type
    const hasBuffet = mealQuoteData.nights && mealQuoteData.nights.some(night => night.type === 'buffet');
    
    if (hasBuffet) {
      // For buffet, calculate cost per room based on room guests
      const roomGuests = room.adults + room.children;
      const buffetNights = mealQuoteData.buffet_nights || 0;
      const adultPrice = mealQuoteData.nights?.[0]?.adult_price || 0;
      const childPrice = mealQuoteData.nights?.[0]?.child_price || 0;
      const roomMealCost = (room.adults * adultPrice + room.children * childPrice) * buffetNights;
      
      return {
        type: 'Buffet',
        cost: roomMealCost,
        details: `${buffetNights} night(s)`
      };
      } else {
        // Free breakfast - calculate extra guests for this specific room
        const roomGuests = room.adults + room.children;
        const roomMaxGuests = room.room_capacity || 2;
        const extraGuestsInRoom = Math.max(0, roomGuests - roomMaxGuests);
        
        // Calculate cost for extra guests per night (like cart logic)
        let totalExtraCost = 0;
        if (extraGuestsInRoom > 0 && mealQuoteData.nights && mealQuoteData.nights.length > 0) {
          mealQuoteData.nights.forEach(night => {
            if (night.type === 'free_breakfast') {
              const roomBreakfastCost = extraGuestsInRoom * (night.adult_breakfast_price || 0);
              totalExtraCost += roomBreakfastCost;
            }
          });
        }
        
        return {
          type: 'Free Breakfast',
          cost: totalExtraCost,
          breakfastPrice: extraGuestsInRoom > 0 && mealQuoteData.nights && mealQuoteData.nights.length > 0 ? mealQuoteData.nights[0].adult_breakfast_price || 0 : 0,
          details: `Free: ${Math.min(roomGuests, roomMaxGuests)}, Extra: ${extraGuestsInRoom}${totalExtraCost > 0 ? ` (${formatCurrency(totalExtraCost)})` : ''}`
        };
      }
  }
};

// Helper function to get overall meal information for booking
const getMealInfo = (booking) => {
  const bookingType = booking.booking_type || 'overnight';
  
  if (bookingType === 'day_tour') {
    // For Day Tours, sum up meal costs from all rooms
    const totalMealCost = booking.rooms.reduce((sum, room) => sum + (room.meal_cost || 0), 0);
    const roomsWithLunch = booking.rooms.filter(room => room.include_lunch).length;
    const roomsWithPmSnack = booking.rooms.filter(room => room.include_pm_snack).length;
    
    let details = [];
    if (roomsWithLunch > 0) details.push(`${roomsWithLunch} room(s) with lunch`);
    if (roomsWithPmSnack > 0) details.push(`${roomsWithPmSnack} room(s) with PM snack`);
    if (details.length === 0) details.push('No meals');
    
    return {
      type: 'Day Tour Meals',
      cost: totalMealCost,
      details: details.join(', ')
    };
  } else {
    const mealQuoteData = booking.meal_quote_data || {};
    // For overnight bookings, check meal program type
    const hasBuffet = mealQuoteData.nights && mealQuoteData.nights.some(night => night.type === 'buffet');
    
    if (hasBuffet) {
      const totalMealCost = mealQuoteData.meal_subtotal || 0;
      const buffetNights = mealQuoteData.buffet_nights || 0;
      return {
        type: 'Buffet',
        cost: totalMealCost,
        details: `${buffetNights} night(s)`
      };
      } else {
        // Free breakfast - calculate total extra guests across all rooms
        let totalFreeGuests = 0;
        let totalExtraGuests = 0;
        let totalExtraCost = 0;
        
        booking.rooms.forEach(room => {
          const roomGuests = room.adults + room.children;
          const roomMaxGuests = room.room_capacity || 2;
          const extraGuestsInRoom = Math.max(0, roomGuests - roomMaxGuests);
          
          totalFreeGuests += roomMaxGuests;
          totalExtraGuests += extraGuestsInRoom;
          
          // Calculate extra cost for this room per night (like cart logic)
          if (extraGuestsInRoom > 0 && mealQuoteData.nights && mealQuoteData.nights.length > 0) {
            mealQuoteData.nights.forEach(night => {
              if (night.type === 'free_breakfast') {
                const roomBreakfastCost = extraGuestsInRoom * (night.adult_breakfast_price || 0);
                totalExtraCost += roomBreakfastCost;
              }
            });
          }
        });
        
        return {
          type: 'Free Breakfast',
          cost: totalExtraCost,
          details: `Free: ${totalFreeGuests}, Extra: ${totalExtraGuests}${totalExtraCost > 0 ? ` (${formatCurrency(totalExtraCost)})` : ''}`
        };
      }
  }
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
          booking_type: event.booking_type,
          meal_quote_data: event.meal_quote_data,
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
                            Capacity: {room.room_capacity} pax • {
                              booking.booking_type === 'day_tour' 
                                ? `${formatCurrency(room.price_per_pax || room.room_price_per_night || 0)} per pax`
                                : `${formatCurrency(room.room_price_per_night || 0)} per night`
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {room.adults} adults, {room.children} children
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {(() => {
                              const mealInfo = getMealInfoPerRoom(booking, room);
                              
                              if (booking.booking_type === 'day_tour') {
                                // For Day Tours, show meal selection and cost
                                return (
                                  <>
                                    <div>
                                      Meals: {mealInfo.details}
                                    </div>
                                    <div>
                                      Meal Cost: {mealInfo.cost > 0 ? formatCurrency(mealInfo.cost) : 'Free'}
                                    </div>
                                  </>
                                );
                              } else {
                                // For overnight bookings, show breakfast details
                                const roomGuests = room.adults + room.children;
                                const roomMaxGuests = room.room_capacity || 2;
                                const extraGuests = Math.max(0, roomGuests - roomMaxGuests);
                                
                                return (
                                  <>
                                    <div>
                                      Free Breakfast: {Math.min(roomGuests, roomMaxGuests)}{extraGuests > 0 ? `, Extra: ${extraGuests}` : ''}
                                    </div>
                                    {extraGuests > 0 && mealInfo.breakfastPrice && (
                                      <div>
                                        Breakfast Price: {formatCurrency(mealInfo.breakfastPrice)}
                                      </div>
                                    )}
                                    <div>
                                      Meal: {mealInfo.cost > 0 ? formatCurrency(mealInfo.cost) : 'Free'}
                                    </div>
                                  </>
                                );
                              }
                            })()}
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
                    <div>{formatCurrency(booking.final_price || 0)}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.booking_type === 'day_tour' 
                        ? 'Day Tour'
                        : `${booking.nights} night${booking.nights !== 1 ? 's' : ''}`
                      }
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    <div className={booking.remaining_balance > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                      {formatCurrency(booking.remaining_balance || 0)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {(() => {
                      const mealInfo = getMealInfo(booking);
                      
                      if (booking.booking_type === 'day_tour') {
                        // For Day Tours, show meal selections
                        return (
                          <>
                            <div className="font-medium">{mealInfo.type}</div>
                            <div className="text-muted-foreground">
                              {mealInfo.cost > 0 ? formatCurrency(mealInfo.cost) : 'Free'}
                            </div>
                            <div className="text-xs text-blue-600">
                              {mealInfo.details}
                            </div>
                          </>
                        );
                      } else {
                        // For overnight bookings, show breakfast breakdown
                        let totalFreeBreakfastGuests = 0;
                        let totalPaidBreakfastGuests = 0;
                        
                        // Calculate per room
                        booking.rooms.forEach(room => {
                          const roomGuests = room.adults + room.children;
                          const roomCapacity = room.room_capacity || 2;
                          
                          // Free breakfast = actual guests booked (up to room capacity)
                          const freeGuests = Math.min(roomGuests, roomCapacity);
                          // Paid breakfast = guests beyond room capacity
                          const paidGuests = Math.max(0, roomGuests - roomCapacity);
                          
                          totalFreeBreakfastGuests += freeGuests;
                          totalPaidBreakfastGuests += paidGuests;
                        });
                        
                        return (
                          <>
                            <div className="font-medium">{mealInfo.type}</div>
                            <div className="text-muted-foreground">
                              {mealInfo.cost > 0 ? formatCurrency(mealInfo.cost) : 'Free'}
                            </div>
                            <div className="text-xs text-green-600">
                              {totalFreeBreakfastGuests} free breakfast
                            </div>
                            {totalPaidBreakfastGuests > 0 && (
                              <div className="text-xs text-orange-600">
                                {totalPaidBreakfastGuests} paid breakfast
                              </div>
                            )}
                          </>
                        );
                      }
                    })()}
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