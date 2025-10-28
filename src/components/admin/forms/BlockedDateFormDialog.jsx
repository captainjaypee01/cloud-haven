// components/admin/forms/BlockedDateFormDialog.jsx
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from "sonner";
import { Calendar, CalendarDays, Clock, FileText, Users } from 'lucide-react';

const formSchema = z.object({
    room_unit_id: z.string().optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    expiry_date: z.string().min(1, "Expiry date is required"),
    active: z.boolean().default(true),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        return endDate >= startDate;
    }
    return true;
}, {
    message: "End date cannot be before start date",
    path: ["end_date"],
}).refine((data) => {
    if (data.start_date && data.expiry_date) {
        const startDate = new Date(data.start_date);
        const expiryDate = new Date(data.expiry_date);
        return expiryDate <= startDate;
    }
    return true;
}, {
    message: "Expiry date must be before the blocked date (booking deadline)",
    path: ["expiry_date"],
});

const BlockedDateFormDialog = ({ 
    open, 
    onOpenChange, 
    initialData = null, 
    roomUnits = [], 
    selectedRoomUnitIds = [], 
    onSuccess,
    isBulk = false 
}) => {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            room_unit_id: '',
            start_date: '',
            end_date: '',
            expiry_date: '',
            active: true,
            notes: ''
        }
    });
    
    const api = useApi();

    // Reset form when dialog opens/closes or initialData changes
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Editing existing blocked date
                form.reset({
                    room_unit_id: initialData.room_unit_id?.toString() || '',
                    start_date: initialData.start_date || '',
                    end_date: initialData.end_date || '',
                    expiry_date: initialData.expiry_date || '',
                    active: initialData.active !== undefined ? initialData.active : true,
                    notes: initialData.notes || ''
                });
            } else {
                // Creating new blocked date
                const autoSelectRoomUnitId = !isBulk && roomUnits.length === 1 ? roomUnits[0].id.toString() : '';
                
                form.reset({
                    room_unit_id: autoSelectRoomUnitId,
                    start_date: '',
                    end_date: '',
                    expiry_date: '',
                    active: true,
                    notes: ''
                });
            }
        } else {
            // Reset form when dialog closes
            form.reset({
                room_unit_id: '',
                start_date: '',
                end_date: '',
                expiry_date: '',
                active: true,
                notes: ''
            });
        }
    }, [open, initialData, roomUnits, isBulk, form]);

    // Auto-suggest expiry date when start date changes
    const handleStartDateChange = (value) => {
        form.setValue('start_date', value);
        
        // Auto-suggest expiry date (1 week before start date) if expiry date is empty
        const currentExpiryDate = form.getValues('expiry_date');
        if (value && !currentExpiryDate) {
            const startDate = new Date(value);
            const expiryDate = new Date(startDate);
            expiryDate.setDate(startDate.getDate() - 7);
            form.setValue('expiry_date', expiryDate.toISOString().split('T')[0]);
        }
    };

    const onSubmit = async (data) => {
        try {
            let response;
            
            if (isBulk && selectedRoomUnitIds.length > 0) {
                // Bulk create
                response = await api.post(`${API_PREFIX}/admin/room-units/blocked-dates/bulk`, {
                    room_unit_ids: selectedRoomUnitIds,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    expiry_date: data.expiry_date,
                    active: data.active,
                    notes: data.notes
                }, {
                    requiresAuth: true,
                });
            } else {
                // Single create or update
                const url = initialData 
                    ? `${API_PREFIX}/admin/room-units/blocked-dates/${initialData.id}`
                    : `${API_PREFIX}/admin/room-units/blocked-dates`;
                
                const method = initialData ? 'put' : 'post';
                
                // For updates, exclude room_unit_id as it shouldn't be changed
                const payload = initialData 
                    ? {
                        start_date: data.start_date,
                        end_date: data.end_date,
                        expiry_date: data.expiry_date,
                        active: data.active,
                        notes: data.notes
                    }
                    : data;
                
                response = await api[method](url, payload, {
                    requiresAuth: true,
                });
            }

            if (response.data?.success) {
                toast.success(response.data.message || 'Blocked date saved successfully!');
                onSuccess?.();
                onOpenChange(false);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        {initialData ? 'Edit Blocked Date' : isBulk ? 'Add Blocked Dates (Bulk)' : 'Add Blocked Date'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Room Unit Selection (only for single create) */}
                    {!isBulk && !initialData && (
                        <FormField
                            control={form.control}
                            name="room_unit_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Room Unit *
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a room unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roomUnits.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                    {unit.room?.name} - Unit {unit.unit_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Selected Room Units Display (for bulk) */}
                    {isBulk && selectedRoomUnitIds.length > 0 && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Selected Room Units ({selectedRoomUnitIds.length})
                            </Label>
                            <div className="p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                                {roomUnits
                                    .filter(unit => selectedRoomUnitIds.includes(unit.id))
                                    .map((unit) => (
                                        <div key={unit.id} className="text-sm text-gray-600">
                                            {unit.room?.name} - Unit {unit.unit_number}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Start Date *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                handleStartDateChange(e.target.value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        End Date *
                                    </FormLabel>
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
                    </div>

                    {/* Expiry Date */}
                    <FormField
                        control={form.control}
                        name="expiry_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Expiry Date *
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-gray-500">
                                    Booking deadline - guest must confirm by this date or the block will expire
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Active Status */}
                    <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="text-sm font-medium">
                                    Active
                                </FormLabel>
                                <p className="text-xs text-gray-500 ml-2">
                                    Only active blocked dates prevent bookings
                                </p>
                            </FormItem>
                        )}
                    />

                    {/* Notes */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Notes
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Optional notes about this blocked date..."
                                        rows={3}
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
                            onClick={handleCancel}
                            disabled={form.formState.isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BlockedDateFormDialog;
