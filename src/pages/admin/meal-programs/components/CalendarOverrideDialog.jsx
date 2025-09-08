import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  override_type: z.enum(["date", "month"]),
  date: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional(),
  is_active: z.boolean(),
  note: z.string().optional().nullable(),
}).refine((data) => {
  if (data.override_type === "date") {
    return data.date && data.date.length > 0;
  } else if (data.override_type === "month") {
    return data.month && data.year;
  }
  return false;
}, {
  message: "Please provide the required fields for the selected override type",
  path: ["override_type"],
});

export default function CalendarOverrideDialog({ open, onOpenChange, onSave, override }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      override_type: override?.override_type || "date",
      date: override?.date || "",
      month: override?.month || undefined,
      year: override?.year || undefined,
      is_active: override?.is_active || false,
      note: override?.note || "",
    },
  });

  React.useEffect(() => {
    if (override) {
      form.reset({
        override_type: override.override_type || "date",
        date: override.date || "",
        month: override.month || undefined,
        year: override.year || undefined,
        is_active: override.is_active,
        note: override.note || "",
      });
    } else {
      form.reset({
        override_type: "date",
        date: "",
        month: undefined,
        year: undefined,
        is_active: false,
        note: "",
      });
    }
  }, [override, form]);

  const handleSubmit = (values) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{override ? "Edit Calendar Override" : "Add Calendar Override"}</DialogTitle>
          <DialogDescription>
            Override the normal buffet schedule for a specific date or entire month. You can force the buffet to be active or inactive regardless of the program's rules.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="override_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Override Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select override type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="date">Specific Date</SelectItem>
                      <SelectItem value="month">Entire Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("override_type") === "date" && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("override_type") === "month" && (
              <>
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2020"
                          max="2030"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Force Buffet Active
                    </FormLabel>
                    <FormDescription>
                      {field.value 
                        ? `Buffet will be active ${form.watch("override_type") === "month" ? "for this month" : "on this date"}` 
                        : `Buffet will be inactive ${form.watch("override_type") === "month" ? "for this month" : "on this date"}`}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., Special event, Maintenance day..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer">
                {override ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
