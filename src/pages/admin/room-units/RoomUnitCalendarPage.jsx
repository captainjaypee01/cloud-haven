// pages/admin/room-units/RoomUnitCalendarPage.jsx
import React from 'react';
import Title from '../../../components/Title';
import RoomUnitCalendar from '../../../components/admin/calendar/RoomUnitCalendar';

const RoomUnitCalendarPage = () => {
  return (
    <div>
      <Title
        align='left'
        font='outfit'
        title="Room Unit Calendar"
        subTitle="View room unit availability across the month. Track bookings, maintenance periods, and blocked dates for all overnight rooms."
      />
      
      <div className="mt-6">
        <RoomUnitCalendar />
      </div>
    </div>
  );
};

export default RoomUnitCalendarPage;
