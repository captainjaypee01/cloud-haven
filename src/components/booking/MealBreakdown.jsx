import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { API_PREFIX } from "@/constants/api";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import Loader from "@/components/common/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Utensils, Coffee } from "lucide-react";

export default function MealBreakdown({ checkIn, checkOut, adults, children, className = "", onTotalChange }) {
  const [mealQuote, setMealQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (checkIn && checkOut && adults > 0) {
      fetchMealQuote();
    }
  }, [checkIn, checkOut, adults, children]);

  const fetchMealQuote = async () => {
    try {
      setLoading(true);
      const response = await api.post(`${API_PREFIX}/public/quotes/meal`, {
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children: children || 0,
      });

      // The API returns data directly without success wrapper
      if (response.data) {
        setMealQuote(response.data);
        if (onTotalChange) {
          onTotalChange(response.data.meal_subtotal);
        }
      }
    } catch (error) {
      console.error("Error fetching meal quote:", error);
      if (onTotalChange) {
        onTotalChange(0);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!checkIn || !checkOut || adults === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <Loader variant="wave" />
      </div>
    );
  }

  if (!mealQuote || !mealQuote.nights) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Meal Breakdown</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Adults</TableHead>
              <TableHead className="text-right">Children</TableHead>
              <TableHead className="text-right">Night Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mealQuote.nights.map((night, index) => (
              <TableRow key={index}>
                <TableCell>{format(new Date(night.date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {night.type === "buffet" ? (
                    <Badge variant="success" className="flex items-center gap-1 w-fit">
                      <Utensils className="w-3 h-3" />
                      Buffet
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Coffee className="w-3 h-3" />
                      {mealQuote.labels?.inactive || "Free Breakfast"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {night.type === "buffet" ? (
                    <span>{night.adults} × {formatCurrency(night.adult_price)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {night.type === "buffet" && night.children > 0 ? (
                    <span>{night.children} × {formatCurrency(night.child_price)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(night.night_total)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} className="text-right font-semibold">
                Meal Subtotal:
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(mealQuote.meal_subtotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
