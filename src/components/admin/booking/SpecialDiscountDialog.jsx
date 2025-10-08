// components/admin/booking/SpecialDiscountDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const SpecialDiscountDialog = ({ open, onOpenChange, booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const form = useForm({
    defaultValues: {
      special_discount: booking?.special_discount || 0,
      discount_reason: ''
    }
  });

  useEffect(() => {
    if (open && booking) {
      form.reset({
        special_discount: booking.special_discount || 0,
        discount_reason: ''
      });
    }
  }, [open, booking, form]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.patch(
        `${API_PREFIX}/admin/bookings/${booking.id}/special-discount`,
        {
          special_discount: parseFloat(data.special_discount) || 0,
          discount_reason: data.discount_reason
        },
        { requiresAuth: true }
      );
      
      toast.success('Special discount updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating special discount:', error);
      toast.error('Failed to update special discount');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setLoading(true);
    try {
      await api.patch(
        `${API_PREFIX}/admin/bookings/${booking.id}/special-discount`,
        {
          special_discount: 0,
          discount_reason: ''
        },
        { requiresAuth: true }
      );
      
      toast.success('Special discount removed successfully');
      onSuccess();
    } catch (error) {
      console.error('Error removing special discount:', error);
      toast.error('Failed to remove special discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Special Discount</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="special_discount">Discount Amount (₱)</Label>
            <Input
              id="special_discount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register('special_discount', {
                required: 'Discount amount is required',
                min: { value: 0, message: 'Discount amount must be 0 or greater' }
              })}
            />
            {form.formState.errors.special_discount && (
              <p className="text-sm text-red-600">
                {form.formState.errors.special_discount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_reason">Reason *</Label>
            <Textarea
              id="discount_reason"
              placeholder="Enter reason for this special discount..."
              {...form.register('discount_reason', {
                required: 'Discount reason is required',
                minLength: { value: 3, message: 'Reason must be at least 3 characters long' }
              })}
            />
            {form.formState.errors.discount_reason && (
              <p className="text-sm text-red-600">
                {form.formState.errors.discount_reason.message}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-600">
              {booking?.special_discount > 0 && (
                <div className="mb-2">
                  <strong>Current discount:</strong> {formatCurrency(booking.special_discount)}
                </div>
              )}
              <div>
                <strong>Note:</strong> This discount is applied in addition to any promo discounts and reduces the total payable amount. A reason is required for all discount applications.
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 cursor-pointer"
            >
              Cancel
            </Button>
            {booking?.special_discount > 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveDiscount}
                disabled={loading}
                className="flex-1 cursor-pointer"
              >
                {loading ? 'Removing...' : 'Remove Discount'}
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialDiscountDialog;
