// components/admin/forms/RoomUnitFormDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from "sonner";

const RoomUnitFormDialog = ({ open, onOpenChange, initialData, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: 'available',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const api = useApi();

  // Reset form when dialog opens/closes or data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        status: initialData.status || 'available',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        status: 'available', 
        notes: ''
      });
    }
  }, [initialData, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!initialData?.id) {
      toast.error("No room unit selected for editing");
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.patch(
        `${API_PREFIX}/admin/room-units/${initialData.id}`,
        formData,
        { requiresAuth: true }
      );
      
      if (response.data?.success) {
        toast.success("Room unit updated successfully!");
        onSuccess?.();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update room unit";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Currently Booked' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'blocked', label: 'Blocked' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Room Unit</DialogTitle>
          <DialogDescription>
            Update the status and notes for room unit <strong>{initialData?.unit_number}</strong>
            {initialData?.room?.name && (
              <> in <strong>{initialData.room.name}</strong></>
            )}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Number (read-only) */}
          <div>
            <Label htmlFor="unit-number">Unit Number</Label>
            <Input
              id="unit-number"
              value={initialData?.unit_number || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Room Type (read-only) */}
          {initialData?.room?.name && (
            <div>
              <Label htmlFor="room-name">Room Type</Label>
              <Input
                id="room-name"
                value={initialData.room.name}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this room unit..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-[80px] resize-vertical"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="cursor-pointer"
            >
              {loading ? "Updating..." : "Update Unit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomUnitFormDialog;
