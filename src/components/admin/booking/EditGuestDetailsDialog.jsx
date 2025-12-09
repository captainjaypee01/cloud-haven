import React, { useEffect, useState } from 'react';
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

const EditGuestDetailsDialog = ({ open, onOpenChange, booking, onSuccess }) => {
  const api = useApi();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      guest_name: booking?.guest_name || '',
      guest_email: booking?.guest_email || '',
      guest_phone: booking?.guest_phone || '',
      special_requests: booking?.special_requests || '',
    },
  });

  useEffect(() => {
    if (open && booking) {
      form.reset({
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        special_requests: booking.special_requests || '',
      });
    }
  }, [open, booking, form]);

  const onSubmit = async (data) => {
    if (!booking?.id) return;
    setLoading(true);
    try {
      await api.patch(
        `${API_PREFIX}/admin/bookings/${booking.id}/guest-details`,
        data,
        { requiresAuth: true }
      );
      toast.success('Guest details updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating guest details:', error);
      toast.error('Failed to update guest details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Guest Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest_name">Guest Name *</Label>
            <Input
              id="guest_name"
              placeholder="Guest full name"
              {...form.register('guest_name', {
                required: 'Guest name is required',
                maxLength: { value: 255, message: 'Max 255 characters' },
              })}
            />
            {form.formState.errors.guest_name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.guest_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_email">Guest Email *</Label>
            <Input
              id="guest_email"
              type="email"
              placeholder="guest@email.com"
              {...form.register('guest_email', {
                required: 'Guest email is required',
                maxLength: { value: 255, message: 'Max 255 characters' },
              })}
            />
            {form.formState.errors.guest_email && (
              <p className="text-sm text-red-600">
                {form.formState.errors.guest_email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_phone">Guest Phone</Label>
            <Input
              id="guest_phone"
              placeholder="+63 900 000 0000"
              {...form.register('guest_phone', {
                maxLength: { value: 50, message: 'Max 50 characters' },
              })}
            />
            {form.formState.errors.guest_phone && (
              <p className="text-sm text-red-600">
                {form.formState.errors.guest_phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requests">Special Requests</Label>
            <Textarea
              id="special_requests"
              placeholder="Add any special requests or notes..."
              {...form.register('special_requests', {
                maxLength: { value: 1000, message: 'Max 1000 characters' },
              })}
              rows={4}
            />
            {form.formState.errors.special_requests && (
              <p className="text-sm text-red-600">
                {form.formState.errors.special_requests.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGuestDetailsDialog;

