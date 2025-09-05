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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  currency: z.string().length(3, "Currency must be 3 characters"),
  adult_price: z.number().min(0, "Price must be positive").max(999999.99),
  child_price: z.number().min(0, "Price must be positive").max(999999.99),
  effective_from: z.string().optional().nullable(),
  effective_to: z.string().optional().nullable(),
}).refine((data) => {
  if (data.effective_from && data.effective_to) {
    return new Date(data.effective_to) > new Date(data.effective_from);
  }
  return true;
}, {
  message: "Effective to date must be after effective from date",
  path: ["effective_to"],
});

export default function PricingTierDialog({ open, onOpenChange, onSave, tier }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: tier?.currency || "SGD",
      adult_price: tier?.adult_price || 0,
      child_price: tier?.child_price || 0,
      effective_from: tier?.effective_from || null,
      effective_to: tier?.effective_to || null,
    },
  });

  React.useEffect(() => {
    if (tier) {
      form.reset({
        currency: tier.currency,
        adult_price: parseFloat(tier.adult_price),
        child_price: parseFloat(tier.child_price),
        effective_from: tier.effective_from,
        effective_to: tier.effective_to,
      });
    } else {
      form.reset({
        currency: "SGD",
        adult_price: 0,
        child_price: 0,
        effective_from: null,
        effective_to: null,
      });
    }
  }, [tier, form]);

  const handleSubmit = (values) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tier ? "Edit Pricing Tier" : "Add Pricing Tier"}</DialogTitle>
          <DialogDescription>
            Set the meal prices for adults and children. You can specify effective dates for seasonal pricing.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="PHP">PHP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adult_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adult Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="child_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Child Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From</FormLabel>
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
                name="effective_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective To</FormLabel>
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
                {tier ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
