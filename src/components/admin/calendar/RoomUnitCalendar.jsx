// components/admin/calendar/RoomUnitCalendar.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const RoomUnitCalendar = () => {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const api = useApi();

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    yearOptions.push(year);
  }

  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Status colors mapping
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 border-green-300 hover:bg-green-200',
      booked: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
      pending: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
      maintenance: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
      blocked: 'bg-red-100 border-red-300 hover:bg-red-200',
    };
    return colors[status] || 'bg-gray-100 border-gray-300 hover:bg-gray-200';
  };

  // Fetch calendar data
  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_PREFIX}/admin/room-units/calendar`, {
        params: { year: selectedYear, month: selectedMonth },
        requiresAuth: true,
      });

      if (response.data?.success) {
        setCalendarData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Effect to fetch data when month/year changes
  useEffect(() => {
    fetchCalendarData();
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calendarData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No calendar data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMonthName = monthOptions.find(m => m.value === selectedMonth)?.label || '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Room Unit Calendar
          </CardTitle>
          
          {/* Month/Year Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(-1)}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(1)}
                className="cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span>Blocked</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-lg font-semibold mb-4">
          {currentMonthName} {selectedYear}
        </div>

        {/* Calendar Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-medium min-w-[120px]">
                  Unit
                </th>
                <th className="border border-gray-300 p-2 text-left font-medium min-w-[100px]">
                  Current Status
                </th>
                {calendarData.days.map(day => (
                  <th key={day} className="border border-gray-300 p-1 text-center font-medium w-8">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarData.rooms.map(room => (
                <React.Fragment key={room.room_id}>
                  {/* Room header */}
                  <tr className="bg-gray-100">
                    <td
                      colSpan={2 + calendarData.days.length}
                      className="border border-gray-300 p-2 font-semibold text-gray-800"
                    >
                      {room.room_name}
                    </td>
                  </tr>
                  
                  {/* Room units */}
                  {room.units.map(unit => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">
                        {unit.unit_number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.current_status)}`}>
                          {unit.current_status.charAt(0).toUpperCase() + unit.current_status.slice(1)}
                        </span>
                      </td>
                      {unit.day_statuses.map(dayStatus => (
                        <td key={dayStatus.day} className="border border-gray-300 p-1">
                          <div
                            className={`w-6 h-6 border rounded cursor-pointer transition-colors ${getStatusColor(dayStatus.status)}`}
                            title={`${dayStatus.date}: ${dayStatus.status.charAt(0).toUpperCase() + dayStatus.status.slice(1)}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {calendarData.rooms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No overnight room units found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomUnitCalendar;
