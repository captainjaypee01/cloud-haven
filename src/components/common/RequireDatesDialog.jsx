import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useForm, Controller } from "react-hook-form";
import { useCart } from "@/context/CartContext";
import { useAppContext } from "@/context/AppContext";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const RequireDatesDialog = ({ open, onOpenChange, targetHref }) => {
  const { state, dispatch } = useCart();
  const { navigate } = useAppContext();

  // Prepare default dates
  const defaultFrom = state?.checkIn ? parseISO(state.checkIn) : null;
  const defaultTo = state?.checkOut ? parseISO(state.checkOut) : null;

  const { control, handleSubmit } = useForm({
    defaultValues: { dateRange: { from: defaultFrom, to: defaultTo } },
  });

  const onSubmit = ({ dateRange }) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select both check-in and check-out dates.");
      return;
    }
    dispatch({
      type: "SET_DATES",
      from: format(dateRange.from, "yyyy-MM-dd"),
      to: format(dateRange.to, "yyyy-MM-dd"),
    });
    onOpenChange(false);
    if (targetHref) {
      navigate(targetHref);
      // Ensure top of page after navigation
      setTimeout(() => scrollTo(0, 0), 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select your dates</DialogTitle>
          <DialogDescription>
            To view room details, please choose your check-in and check-out dates.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium block mb-1">
              Check-in & Check-out Date
            </label>
            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <DateRangePicker range={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequireDatesDialog;