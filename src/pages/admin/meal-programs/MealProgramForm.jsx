import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMealProgramsApi } from "@/hooks/api/useMealProgramsApi";
import Loader from "@/components/common/Loader";
import { format } from "date-fns";
import FormSelectField from "@/components/common/form/FormSelectField";
import { ArrowLeft, Calendar } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  status: z.enum(["active", "inactive"]),
  scope_type: z.enum(["always", "date_range", "months", "weekly", "composite"]),
  date_start: z.string().optional().nullable(),
  date_end: z.string().optional().nullable(),
  months: z.array(z.number()).optional().nullable(),
  weekdays: z.array(z.string()).optional().nullable(),
  weekend_definition: z.enum(["SAT_SUN", "FRI_SUN", "CUSTOM"]).default("SAT_SUN"),
  inactive_label: z.string().default("Free Breakfast"),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  if (data.scope_type === "date_range" || (data.scope_type === "composite" && (data.date_start || data.date_end))) {
    return data.date_start && data.date_end;
  }
  return true;
}, {
  message: "Both start and end dates are required for date range",
  path: ["date_end"],
}).refine((data) => {
  if (data.scope_type === "months" && (!data.months || data.months.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one month must be selected",
  path: ["months"],
});

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const WEEKDAYS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

export default function MealProgramForm() {
  const { navigate } = useAppContext();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const mealProgramsApi = useMealProgramsApi();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "inactive",
      scope_type: "always",
      date_start: null,
      date_end: null,
      months: [],
      weekdays: [],
      weekend_definition: "SAT_SUN",
      inactive_label: "Free Breakfast",
      notes: "",
    },
  });

  const scopeType = form.watch("scope_type");
  const weekendDefinition = form.watch("weekend_definition");

  useEffect(() => {
    if (id) {
      fetchProgram();
    }
  }, [id]);

  const fetchProgram = async () => {
    try {
      setFetching(true);
      const response = await mealProgramsApi.show(id);
      const program = response.data;
      form.reset({
        name: program.name,
        status: program.status,
        scope_type: program.scope_type,
        date_start: program.date_start,
        date_end: program.date_end,
        months: program.months || [],
        weekdays: program.weekdays || [],
        weekend_definition: program.weekend_definition,
        inactive_label: program.inactive_label,
        notes: program.notes || "",
      });
    } catch (error) {
      toast.error("Failed to fetch meal program");
      navigate("/admin/meal-programs");
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      if (id) {
        await mealProgramsApi.update(id, values);
        toast.success("Meal program updated successfully");
      } else {
        await mealProgramsApi.create(values);
        toast.success("Meal program created successfully");
      }

      navigate("/admin/meal-programs");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save meal program");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader variant="wave" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {id ? "Edit Meal Program" : "Create Meal Program"}
        </h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/meal-programs/${id}/preview`)}
            className="cursor-pointer"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Preview Calendar
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/meal-programs/${id}`)}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Program
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., October Weekends Buffet" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="scope_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="always">Always Active</SelectItem>
                        <SelectItem value="date_range">Date Range</SelectItem>
                        <SelectItem value="months">Specific Months</SelectItem>
                        <SelectItem value="weekly">Weekly Pattern</SelectItem>
                        <SelectItem value="composite">Composite (Multiple Rules)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines when the buffet program is active
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(scopeType === "date_range" || scopeType === "composite") && (
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {(scopeType === "months" || scopeType === "composite") && (
                <FormField
                  control={form.control}
                  name="months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Months</FormLabel>
                      <div className="grid grid-cols-3 gap-4">
                        {MONTHS.map((month) => (
                          <FormItem
                            key={month.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(month.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, month.value])
                                    : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== month.value
                                      )
                                    );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {month.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(scopeType === "weekly" || scopeType === "composite") && (
                <>
                  <FormField
                    control={form.control}
                    name="weekend_definition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekend Definition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select weekend definition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAT_SUN">Saturday - Sunday</SelectItem>
                            <SelectItem value="FRI_SUN">Friday - Sunday</SelectItem>
                            <SelectItem value="CUSTOM">Custom Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {weekendDefinition === "CUSTOM" && (
                    <FormField
                      control={form.control}
                      name="weekdays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Active Days</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            {WEEKDAYS.map((day) => (
                              <FormItem
                                key={day.value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day.value])
                                        : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value
                                          )
                                        );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="inactive_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inactive Label</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Free Breakfast" />
                    </FormControl>
                    <FormDescription>
                      Label shown when buffet is not active
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Additional notes about this program..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer"
                >
                  {loading ? <Loader variant="wave" /> : id ? "Update Program" : "Create Program"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/meal-programs")}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
