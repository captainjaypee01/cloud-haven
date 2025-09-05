import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { format } from "date-fns";
import Loader from "@/components/common/Loader";
import { Utensils, Coffee } from "lucide-react";

export default function MealAvailabilityBadges({ checkIn, checkOut, className = "" }) {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (checkIn && checkOut) {
      fetchAvailability();
    }
  }, [checkIn, checkOut]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_PREFIX}/public/meal-availability`, {
        params: {
          from: checkIn,
          to: checkOut,
        },
      });

      // The API returns data directly without success wrapper
      if (response.data) {
        setAvailability(response.data);
      }
    } catch (error) {
      console.error("Error fetching meal availability:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!checkIn || !checkOut) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader variant="wave" />
      </div>
    );
  }

  // Count buffet and free breakfast nights
  const nights = Object.values(availability);
  const buffetNights = nights.filter(n => n === "buffet").length;
  const freeBreakfastNights = nights.filter(n => n === "free_breakfast").length;

  if (nights.length === 0) {
    return null;
  }

  // Get buffet and free breakfast dates
  const buffetDates = Object.entries(availability)
    .filter(([date, type]) => type === 'buffet')
    .map(([date]) => {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    });
  
  const freeBreakfastDates = Object.entries(availability)
    .filter(([date, type]) => type === 'free_breakfast')
    .map(([date]) => {
      // Show the next day (when breakfast is actually served)
      const breakfastDate = new Date(date);
      breakfastDate.setDate(breakfastDate.getDate() + 1);
      return breakfastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {buffetNights > 0 && (
        <Badge variant="success" className="flex items-center gap-1">
          <Utensils className="w-3 h-3" />
          Buffet on {buffetNights} night{buffetNights > 1 ? "s" : ""} ({buffetDates.join(', ')})
        </Badge>
      )}
      {freeBreakfastNights > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Coffee className="w-3 h-3" />
          Complimentary Breakfast Only on {freeBreakfastNights} day{freeBreakfastNights > 1 ? "s" : ""} ({freeBreakfastDates.join(', ')})
        </Badge>
      )}
    </div>
  );
}
