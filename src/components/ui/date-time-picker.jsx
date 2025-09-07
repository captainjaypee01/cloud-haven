import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Pick a date and time",
  className,
  disabled = false,
  ...props
}) {
  const [time, setTime] = React.useState(() => {
    if (date) {
      return format(date, "HH:mm")
    }
    return "00:00"
  })

  // Update time when date changes
  React.useEffect(() => {
    if (date) {
      setTime(format(date, "HH:mm"))
    }
  }, [date])

  const handleTimeChange = (newTime) => {
    setTime(newTime)
    if (date) {
      const [hours, minutes] = newTime.split(":")
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
      setDate(newDate)
    }
  }

  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(":")
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hours, 10))
      newDate.setMinutes(parseInt(minutes, 10))
      setDate(newDate)
    } else {
      setDate(undefined)
    }
  }

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP 'at' p") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 max-w-[90vw] sm:max-w-none" align="start">
          <div className="flex flex-col sm:flex-row">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="border-l-0 sm:border-l border-t sm:border-t-0 p-3">
              <div className="space-y-2">
                <Label htmlFor="time-picker">Time</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time-picker"
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-36"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
