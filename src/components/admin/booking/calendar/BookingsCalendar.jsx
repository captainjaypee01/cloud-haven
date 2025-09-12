import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Printer, Download } from "lucide-react";
import FormSelectField from "@/components/common/form/FormSelectField";
import Loader from "@/components/common/Loader";
import MonthGrid from "./MonthGrid";
import DayTimeline from "./DayTimeline";
import DayTable from "./DayTable";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { useBookingsAdminApi } from "@/hooks/api/useBookingsAdminApi";
import * as roomsSvc from "@/services/rooms";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/format";

// Date utility functions
const getFirstDayOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLastDayOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function BookingsCalendar({ initialDate, initialMonth }) {
  const [view, setView] = useState("month");
  
  // Initialize with current date but ensure it's set to the first of the month for month view
  const today = new Date();
  
  // Handle initial date from URL parameters
  const getInitialDate = () => {
    if (initialDate) {
      const parsedDate = new Date(initialDate);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return today;
  };

  const getInitialMonth = () => {
    if (initialMonth) {
      const [year, month] = initialMonth.split('-');
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const [currentDate, setCurrentDate] = useState(getInitialMonth());
  const [selectedDate, setSelectedDate] = useState(getInitialDate());

  // Set initial view based on parameters
  useEffect(() => {
    if (initialDate) {
      setView('day');
      const parsedDate = new Date(initialDate);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    } else if (initialMonth) {
      setView('month');
      const [year, month] = initialMonth.split('-');
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
      }
    }
  }, [initialDate, initialMonth]);

  const api = useApi();
  const bookingsApi = useBookingsAdminApi();
  const form = useForm({
    defaultValues: {
      room_type_id: "all",
      status: "all"
    }
  });

  // Load room type options
  const { data: roomsData, error: roomsError } = useQuery({
    queryKey: ["rooms-for-calendar"],
    queryFn: () => roomsSvc.listRooms(api, "?page=1&per_page=1000"),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const roomOptions = useMemo(() => {
    if (!roomsData?.data) return [{ value: "all", label: "All Room Types" }];
    const items = roomsData.data
      .filter(r => r.id !== undefined && r.id !== null) // Filter out rooms without valid IDs
      .map(r => ({
        value: String(r.id),
        label: r.name || 'Unnamed Room'
      }));
    return [{ value: "all", label: "All Room Types" }, ...items];
  }, [roomsData]);

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "downpayment", label: "Downpayment" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
    { value: "failed", label: "Failed" },
  ];

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'month') {
      const start = getFirstDayOfMonth(currentDate);
      const end = getLastDayOfMonth(currentDate);
      return {
        start: formatDate(start),
        end: formatDate(end)
      };
    } else {
      // Day view
      return {
        start: formatDate(selectedDate),
        end: formatDate(selectedDate)
      };
    }
  }, [view, currentDate, selectedDate]);

  // Build API parameters
  const filters = form.watch();
  const apiParams = useMemo(() => {
    const params = {
      start: dateRange.start,
      end: dateRange.end
    };

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.room_type_id && filters.room_type_id !== 'all') {
      params.room_type_id = parseInt(filters.room_type_id);
    }

    return params;
  }, [dateRange, filters]);

  // Fetch calendar data
  const { data, isFetching, error: calendarError } = useQuery({
    queryKey: ["admin-bookings-calendar", apiParams],
    queryFn: () => bookingsApi.calendar(apiParams).then(r => r.data),
    retry: 2,
    enabled: !!apiParams.start && !!apiParams.end,
  });

  const summary = data?.summary || [];
  const events = data?.events || [];

  // Navigation functions
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      return newDate;
    });
  };

  const navigateDay = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + direction);
      return newDate;
    });
  };

  // Handle day click in month view
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setView('day');
  };

  // Helper function to get booking type display and breakfast info
  const getBookingTypeInfo = (booking) => {
    const bookingType = booking.booking_type || 'overnight';
    const mealQuoteData = booking.meal_quote_data || {};
    const totalGuests = booking.booking_adults + booking.booking_children;
    
    let typeDisplay = '';
    let breakfastInfo = '';
    
    switch (bookingType) {
      case 'day_tour':
        typeDisplay = 'Day Tour';
        break;
      case 'overnight':
        // Check meal_quote_data to determine if buffet or free breakfast
        const hasBuffet = mealQuoteData.nights && mealQuoteData.nights.some(night => night.type === 'buffet');
        
        if (hasBuffet) {
          typeDisplay = 'Overnight (Buffet)';
        } else {
          typeDisplay = 'Overnight (Free Breakfast)';
          // Calculate free breakfast guests (typically 2 per room) and extra guests
          const totalRooms = booking.rooms ? booking.rooms.length : 1;
          const freeBreakfastGuests = totalRooms * 2; // 2 free breakfast per room
          const extraGuests = Math.max(0, totalGuests - freeBreakfastGuests);
          breakfastInfo = `Free: ${freeBreakfastGuests}, Extra: ${extraGuests}`;
        }
        break;
      default:
        typeDisplay = 'Overnight (Buffet)';
    }
    
    return { typeDisplay, breakfastInfo };
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
          details: `Free: ${roomMaxGuests}, Extra: ${extraGuestsInRoom}${totalExtraCost > 0 ? ` (${formatCurrency(totalExtraCost)})` : ''}`
        };
      }
    }
  };

  // Helper function to get overall meal information for booking
  const getMealInfo = (booking) => {
    const bookingType = booking.booking_type || 'overnight';
    const mealQuoteData = booking.meal_quote_data || {};
    
    if (bookingType === 'day_tour') {
      // For day tours, show total meal cost from selections
      if (mealQuoteData.selections && Array.isArray(mealQuoteData.selections)) {
        const totalMealCost = mealQuoteData.selections.reduce((sum, selection) => sum + (selection.meal_cost || 0), 0);
        return {
          type: 'Day Tour Meals',
          cost: totalMealCost,
          details: `${mealQuoteData.selections.length} selection(s)`
        };
      }
      return { type: 'Day Tour Meals', cost: 0, details: 'No meal data' };
    } else {
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

  // Print functionality
  const handlePrint = () => {
    const targetDate = formatDate(view === 'day' ? selectedDate : currentDate);
    const selectedDateEvents = events.filter(ev => {
      // For Day Tours, start and end are the same date
      if (ev.booking_type === 'day_tour') {
        return ev.start === targetDate;
      }
      // For overnight bookings, use the standard logic (exclude checkout day)
      return ev.start <= targetDate && targetDate < ev.end;
    });

    // Group events by booking_id
    const bookingMap = new Map();
    selectedDateEvents.forEach(event => {
      const bookingId = event.booking_id;
      // Skip events without a valid booking_id
      if (!bookingId || bookingId === undefined || bookingId === null) {
        return;
      }
      
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
          booking_type: event.booking_type || 'overnight',
          meal_quote_data: event.meal_quote_data,
          rooms: []
        });
      }
      
      // Add room to the booking with Day Tour specific fields (print function)
      const roomData = {
        room_type_name: event.room_type_name,
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

    const groupedBookings = Array.from(bookingMap.values());

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bookings for ${targetDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .booking-header { background-color: #f8f9fa; font-weight: bold; }
            .room-row { background-color: #ffffff; }
            .status-paid { background-color: #d4edda; }
            .status-pending { background-color: #fff3cd; }
            .status-downpayment { background-color: #fff3cd; }
            .status-cancelled { background-color: #f8d7da; }
            .status-failed { background-color: #f8d7da; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Bookings for ${targetDate}</h1>
            <p>Date: ${targetDate}</p>
            <p>Total Bookings: ${groupedBookings.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Guest</th>
                <th>Status</th>
                <th>Type</th>
                <th>Room Details</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Total Price</th>
                <th>Balance</th>
                <th>Total Guests</th>
                <th>Breakfast Info</th>
              </tr>
            </thead>
            <tbody>
              ${groupedBookings.map((booking) => {
                const { typeDisplay, breakfastInfo } = getBookingTypeInfo(booking);
                return `
                  <tr class="booking-header status-${booking.status}">
                    <td>${booking.reference_number}</td>
                    <td>${booking.guest_name}</td>
                    <td>${booking.status}</td>
                    <td>${typeDisplay}</td>
                    <td>${booking.rooms.length} room(s)</td>
                    <td>${booking.start}</td>
                    <td>${booking.end}</td>
                    <td>${booking.nights}</td>
                    <td>${formatCurrency(booking.final_price || 0).replace('₱', 'PHP ')}</td>
                    <td>${formatCurrency(booking.remaining_balance || 0).replace('₱', 'PHP ')}</td>
                    <td>${booking.booking_adults + booking.booking_children} (${booking.booking_adults}A, ${booking.booking_children}C)</td>
                    <td>${breakfastInfo || '-'}</td>
                  </tr>
                  ${booking.rooms.map((room) => `
                    <tr class="room-row">
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style="padding-left: 20px;">• ${room.room_unit_number ? 'Unit ' + room.room_unit_number : '(Unassigned)'} - ${room.adults}A, ${room.children}C</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  `).join('')}
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Export functionality
  const handleExport = () => {
    const targetDate = formatDate(view === 'day' ? selectedDate : currentDate);
    const selectedDateEvents = events.filter(ev => {
      // For Day Tours, start and end are the same date
      if (ev.booking_type === 'day_tour') {
        return ev.start === targetDate;
      }
      // For overnight bookings, use the standard logic (exclude checkout day)
      return ev.start <= targetDate && targetDate < ev.end;
    });

    // Group events by booking_id
    const bookingMap = new Map();
    selectedDateEvents.forEach(event => {
      const bookingId = event.booking_id;
      // Skip events without a valid booking_id
      if (!bookingId || bookingId === undefined || bookingId === null) {
        return;
      }
      
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
          booking_type: event.booking_type || 'overnight',
          meal_quote_data: event.meal_quote_data,
          rooms: []
        });
      }
      
      // Add room to the booking with Day Tour specific fields (export function)
      const roomData = {
        room_type_name: event.room_type_name,
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

    const groupedBookings = Array.from(bookingMap.values());

    // Create CSV matching print format: booking header + room details
    const csvRows = [
      ['Reference', 'Guest', 'Status', 'Type', 'Room Details', 'Check-in', 'Check-out', 'Nights', 'Total Price', 'Balance', 'Total Guests', 'Breakfast Info']
    ];

    groupedBookings.forEach(booking => {
      const { typeDisplay, breakfastInfo } = getBookingTypeInfo(booking);
      
      // Add booking header row
      csvRows.push([
        booking.reference_number,
        booking.guest_name,
        booking.status,
        typeDisplay,
        `${booking.rooms.length} room(s)`,
        booking.start,
        booking.end,
        booking.nights,
        formatCurrency(booking.final_price || 0).replace('₱', 'PHP '),
        formatCurrency(booking.remaining_balance || 0).replace('₱', 'PHP '),
        `${booking.booking_adults + booking.booking_children} (${booking.booking_adults}A, ${booking.booking_children}C)`,
        breakfastInfo || '-'
      ]);
      
      // Add room detail rows
      booking.rooms.forEach((room) => {
        csvRows.push([
          '', // Empty reference
          '', // Empty guest
          '', // Empty status
          '', // Empty type
          `${room.room_unit_number ? 'Unit ' + room.room_unit_number : '(Unassigned)'} - ${room.adults}A, ${room.children}C`,
          '', // Empty check-in
          '', // Empty check-out
          '', // Empty nights
          '', // Empty total price
          '', // Empty balance
          '', // Empty total guests
          ''  // Empty breakfast info
        ]);
      });
    });

    const csvContent = csvRows.map(row => 
      row.map(cell => {
        // Clean and escape CSV content - remove special characters that cause issues in Excel
        const cleanCell = String(cell || '')
          .replace(/"/g, '""')           // Escape quotes
          .replace(/\n/g, ' ')          // Replace newlines with spaces
          .replace(/\r/g, '')           // Remove carriage returns
          .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
          .replace(/₱/g, 'PHP')         // Replace peso symbol with PHP
          .replace(/•/g, '-')           // Replace bullet points with dashes
          .replace(/[^\w\s\-.,()]/g, ''); // Remove other special characters except basic punctuation
        return `"${cleanCell}"`;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${targetDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Error states
  if (roomsError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Error Loading Room Types</h3>
          <p>{roomsError.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} className="cursor-pointer">
          Reload Page
        </Button>
      </div>
    );
  }

  if (calendarError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Error Loading Calendar Data</h3>
          <p>{calendarError.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} className="cursor-pointer">
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isFetching && <Loader variant="wave" />}

      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        {/* View Tabs */}
        <Tabs value={view} onValueChange={setView} className="w-fit">
          <TabsList>
            <TabsTrigger value="month" className="cursor-pointer">
              Month View
            </TabsTrigger>
            <TabsTrigger value="day" className="cursor-pointer">
              Day View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Navigation and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => view === 'month' ? navigateMonth(-1) : navigateDay(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="px-4 py-2 text-sm font-medium min-w-[200px] text-center">
              {view === 'month'
                ? formatMonthYear(currentDate)
                : selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }
            </div>

            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => view === 'month' ? navigateMonth(1) : navigateDay(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <Form {...form}>
            <div className="flex items-center gap-3">
              <div className="w-[200px]">
                <FormSelectField
                  name="room_type_id"
                  control={form.control}
                  label="Room Type"
                  options={roomOptions}
                />
              </div>
              <div className="w-[180px]">
                <FormSelectField
                  name="status"
                  control={form.control}
                  label="Status"
                  options={statusOptions}
                />
              </div>
            </div>
          </Form>

          {/* Action Buttons */}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer flex items-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              Print Date
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer flex items-center gap-2"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export Date
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="border rounded-lg bg-white shadow-sm">
        {view === 'month' && (
          <MonthGrid
            currentDate={currentDate}
            summary={summary}
            onDayClick={handleDayClick}
          />
        )}

        {view === 'day' && (
          <div className="p-4 space-y-6">
            <DayTimeline
              date={selectedDate}
              events={events}
            />
            <DayTable
              date={selectedDate}
              events={events}
            />
          </div>
        )}
      </div>
    </div>
  );
}