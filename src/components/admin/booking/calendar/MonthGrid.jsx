import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

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

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isSameMonth = (date, currentDate) => {
  return date.getMonth() === currentDate.getMonth() && 
         date.getFullYear() === currentDate.getFullYear();
};

export default function MonthGrid({ currentDate, summary, onDayClick }) {
  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);
    
    // Get the first day of the week (Sunday = 0)
    const startOfWeek = firstDay.getDay();
    
    const cells = [];
    
    // Add previous month's trailing days
    for (let i = 0; i < startOfWeek; i++) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (startOfWeek - i));
      cells.push({
        date,
        inCurrentMonth: false,
      });
    }
    
    // Add current month's days
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(firstDay);
      date.setDate(day);
      cells.push({
        date,
        inCurrentMonth: true,
      });
    }
    
    // Add next month's leading days to complete the grid (42 cells = 6 weeks)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(lastDay);
      date.setDate(lastDay.getDate() + i);
      cells.push({
        date,
        inCurrentMonth: false,
      });
    }
    
    return cells;
  }, [currentDate]);

  // Create summary map for quick lookup
  const summaryMap = useMemo(() => {
    const map = new Map();
    (summary || []).forEach((item) => {
      map.set(item.date, item);
    });
    return map;
  }, [summary]);

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((cell, index) => {
          const dateStr = formatDate(cell.date);
          const summaryData = summaryMap.get(dateStr);
          const isCurrentMonth = cell.inCurrentMonth;
          const isTodayCell = isToday(cell.date);
          

          
          return (
            <button
              key={`${dateStr}-${index}`}
              onClick={() => onDayClick && onDayClick(cell.date)}
              className={`
                relative p-2 min-h-[80px] border rounded-md text-left transition-all duration-200
                ${isCurrentMonth 
                  ? isTodayCell
                    ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
                    : "bg-background hover:bg-accent/50 border-border"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border-muted"
                }
                hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20
                cursor-pointer
              `}
              disabled={!isCurrentMonth}
              aria-label={`${cell.date.toLocaleDateString()} ${summaryData ? `- ${summaryData.bookings} bookings` : ''}`}
            >
              {/* Date number */}
              <div className={`
                text-sm font-medium mb-1
                ${isTodayCell ? "text-primary font-semibold" : ""}
              `}>
                {cell.date.getDate()}
              </div>
              
              {/* Booking summary */}
              {summaryData && isCurrentMonth && (
                <div className="space-y-1">
                  <Badge 
                    variant="success" 
                    className="text-xs px-1 py-0"
                  >
                    {summaryData.bookings} booked
                  </Badge>
                  
                  <Badge 
                    variant={summaryData.rooms_left > 0 ? "secondary" : "destructive"} 
                    className="text-xs px-1 py-0"
                  >
                    {summaryData.rooms_left} left
                  </Badge>
                </div>
              )}
              
              {/* Today indicator */}
              {isTodayCell && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}