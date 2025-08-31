import React from "react";
import { useSearchParams } from "react-router-dom";
import Title from "@/components/Title";
import BookingsCalendar from "@/components/admin/booking/calendar/BookingsCalendar";

export default function BookingsCalendarPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');

  return (
    <div className="space-y-6">
      <Title
        align='left'
        font='outfit'
        title='Bookings Calendar'
        subTitle='Visualize occupancy by month and day.'
      />
      <BookingsCalendar 
        initialDate={dateParam}
        initialMonth={monthParam}
      />
    </div>
  );
}

