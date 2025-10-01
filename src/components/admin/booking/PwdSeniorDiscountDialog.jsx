// components/admin/booking/PwdSeniorDiscountDialog.jsx
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

const PwdSeniorDiscountDialog = ({ open, onOpenChange, booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const form = useForm({
    defaultValues: {
      pwd_senior_discount: booking?.pwd_senior_discount || 0,
      discount_reason: ''
    }
  });

  useEffect(() => {
    if (open && booking) {
      form.reset({
        pwd_senior_discount: booking.pwd_senior_discount || 0,
        discount_reason: ''
      });
    }
  }, [open, booking, form]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.patch(
        `${API_PREFIX}/admin/bookings/${booking.id}/pwd-senior-discount`,
        {
          pwd_senior_discount: parseFloat(data.pwd_senior_discount) || 0,
          discount_reason: data.discount_reason
        },
        { requiresAuth: true }
      );
      
      toast.success('PWD/Senior discount updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating PWD/Senior discount:', error);
      toast.error('Failed to update PWD/Senior discount');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setLoading(true);
    try {
      await api.patch(
        `${API_PREFIX}/admin/bookings/${booking.id}/pwd-senior-discount`,
        {
          pwd_senior_discount: 0,
          discount_reason: ''
        },
        { requiresAuth: true }
      );
      
      toast.success('PWD/Senior discount removed successfully');
      onSuccess();
    } catch (error) {
      console.error('Error removing PWD/Senior discount:', error);
      toast.error('Failed to remove PWD/Senior discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage PWD/Senior Discount</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwd_senior_discount">Discount Amount (₱)</Label>
            <Input
              id="pwd_senior_discount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register('pwd_senior_discount', {
                required: 'Discount amount is required',
                min: { value: 0, message: 'Discount amount must be 0 or greater' }
              })}
            />
            {form.formState.errors.pwd_senior_discount && (
              <p className="text-sm text-red-600">
                {form.formState.errors.pwd_senior_discount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_reason">Reason for Discount (Optional)</Label>
            <Textarea
              id="discount_reason"
              placeholder="Enter reason for PWD/Senior discount..."
              {...form.register('discount_reason')}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This discount will be applied in addition to any existing promo discounts. 
              The total discount cannot exceed the booking amount.
            </p>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onOpenChange}
                disabled={loading}
              >
                Cancel
              </Button>
              {booking?.pwd_senior_discount > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemoveDiscount}
                  disabled={loading}
                >
                  Remove Discount
                </Button>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Discount'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PwdSeniorDiscountDialog;
