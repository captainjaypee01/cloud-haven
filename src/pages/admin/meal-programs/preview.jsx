import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMealProgramsApi } from "@/hooks/api/useMealProgramsApi";
import Loader from "@/components/common/Loader";
import { cn } from "@/lib/utils";

export default function MealProgramPreview() {
  const { navigate } = useAppContext();
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const mealProgramsApi = useMealProgramsApi();

  useEffect(() => {
    fetchProgram();
  }, [id]);

  useEffect(() => {
    if (program) {
      fetchCalendarData();
    }
  }, [currentMonth, program]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await mealProgramsApi.show(id);
      const programData = response.data;
      setProgram(programData);

      // Set initial month based on program's date range or current month
      if (programData.scope_type === 'date_range' && programData.date_start) {
        setCurrentMonth(new Date(programData.date_start));
      } else {
        setCurrentMonth(new Date());
      }
    } catch (error) {
      toast.error("Failed to fetch meal program");
      navigate("/admin/meal-programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoadingCalendar(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch extra days to cover the full calendar view
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);

      const response = await mealProgramsApi.preview(id, {
        from: format(calendarStart, "yyyy-MM-dd"),
        to: format(calendarEnd, "yyyy-MM-dd"),
      });

      setCalendarData(response.data);
    } catch (error) {
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      if (index > 0 && index % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 text-center font-medium text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const isBuffet = calendarData[dateKey] === "buffet";
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative min-h-[80px] p-2 border rounded-lg transition-colors",
                    !isCurrentMonth && "opacity-50",
                    isToday && "ring-2 ring-primary",
                    isBuffet ? "bg-green-50 border-green-200" : "bg-gray-50"
                  )}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, "d")}
                  </div>
                  <Badge
                    variant={isBuffet ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {isBuffet ? "Buffet" : "Free"}
                  </Badge>
                  {program?.calendar_overrides?.find(o => o.date === dateKey) && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" title="Has override" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader variant="wave" />
      </div>
    );
  }

  if (!program) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Preview Calendar</h1>
          <p className="text-muted-foreground mt-2">{program.name}</p>
          {program.scope_type === 'date_range' && program.date_start && program.date_end && (
            <p className="text-sm text-muted-foreground">
              Active: {format(new Date(program.date_start), 'MMM dd, yyyy')} - {format(new Date(program.date_end), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/meal-programs/${id}`)}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="cursor-pointer"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCalendar ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader variant="wave" />
            </div>
          ) : (
            renderCalendar()
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
              <span className="text-sm">Buffet Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border rounded" />
              <span className="text-sm">Free Breakfast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm">Has Calendar Override</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Scope Type:</span>{" "}
              <span className="capitalize">{program.scope_type.replace("_", " ")}</span>
            </div>
            {program.date_start && program.date_end && (
              <div>
                <span className="font-medium">Date Range:</span>{" "}
                {format(new Date(program.date_start), "MMM d, yyyy")} -{" "}
                {format(new Date(program.date_end), "MMM d, yyyy")}
              </div>
            )}
            {program.months && program.months.length > 0 && (
              <div>
                <span className="font-medium">Active Months:</span>{" "}
                {program.months.map(m => {
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  return monthNames[m - 1];
                }).join(", ")}
              </div>
            )}
            {program.scope_type === "weekly" && (
              <div>
                <span className="font-medium">Weekly Pattern:</span>{" "}
                {program.weekdays?.length
                  ? program.weekdays.join(", ")
                  : program.weekend_definition === "FRI_SUN"
                    ? "Friday - Sunday"
                    : "Saturday - Sunday"}
              </div>
            )}
            {program.calendar_overrides && program.calendar_overrides.length > 0 && (
              <div>
                <span className="font-medium">Calendar Overrides:</span>{" "}
                {program.calendar_overrides.length} override(s) configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
