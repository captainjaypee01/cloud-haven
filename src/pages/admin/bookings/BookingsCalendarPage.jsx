import React from "react";
import { useSearchParams } from "react-router-dom";
import Title from "@/components/Title";
import BookingsCalendar from "@/components/admin/booking/calendar/BookingsCalendar";
import RoomUnitCalendar from "@/components/admin/calendar/RoomUnitCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BookingsCalendarPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');

  return (
    <div className="space-y-6">
      <Title
        align='left'
        font='outfit'
        title='Calendar'
        subTitle='Visualize bookings and room unit availability across time.'
      />
      
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="room-units">Room Units</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="mt-6">
          <BookingsCalendar 
            initialDate={dateParam}
            initialMonth={monthParam}
          />
        </TabsContent>
        
        <TabsContent value="room-units" className="mt-6">
          <RoomUnitCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}

