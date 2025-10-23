import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const ChangeRoomUnitDialog = ({ 
    open, 
    onOpenChange, 
    booking, 
    bookingRoom, 
    onSuccess 
}) => {
    const [availableUnits, setAvailableUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const api = useApi();

    // Load available units when dialog opens
    useEffect(() => {
        if (open && bookingRoom && booking) {
            loadAvailableUnits();
            // Reset selected unit when dialog opens
            setSelectedUnitId('');
        }
    }, [open, bookingRoom, booking]);

    const loadAvailableUnits = async () => {
        if (!bookingRoom || !booking) return;
        
        setLoadingUnits(true);
        try {
            // Format dates to Y-m-d format for API
            const checkInDate = new Date(booking.check_in_date).toISOString().split('T')[0];
            const checkOutDate = booking.booking_type === 'day_tour' 
                ? new Date(booking.check_in_date).toISOString().split('T')[0]
                : new Date(booking.check_out_date).toISOString().split('T')[0];
            
            const response = await api.get(
                `${API_PREFIX}/admin/bookings/${booking.id}/available-room-units`,
                {
                    requiresAuth: true,
                    params: {
                        room_id: bookingRoom.room.id,
                        check_in_date: checkInDate,
                        check_out_date: checkOutDate
                    }
                }
            );
            
            // Filter out any units with invalid IDs and ensure all have proper values
            const validUnits = (response.data.available_units || []).filter(unit => 
                unit && unit.id && unit.unit_number && unit.id !== ''
            );
            setAvailableUnits(validUnits);
        } catch (error) {
            console.error('Failed to load available units:', error);
            toast.error('Failed to load available room units');
        } finally {
            setLoadingUnits(false);
        }
    };

    const handleChangeRoomUnit = async () => {
        if (!selectedUnitId) {
            toast.error('Please select a room unit');
            return;
        }

        setLoading(true);
        try {
            await api.patch(
                `${API_PREFIX}/admin/bookings/${booking.id}/booking-rooms/${bookingRoom.id}/change-room-unit`,
                { room_unit_id: parseInt(selectedUnitId) },
                { requiresAuth: true }
            );
            
            toast.success('Room unit changed successfully');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to change room unit:', error);
            toast.error('Failed to change room unit');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedUnitId('');
        setAvailableUnits([]);
        setLoading(false);
        setLoadingUnits(false);
        onOpenChange(false);
    };

    if (!bookingRoom || !booking) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Room Unit</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Room:</strong> {bookingRoom.room?.name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Current Unit:</strong> {bookingRoom.room_unit?.unit_number || 'Not assigned'}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Dates:</strong> {formatDate(booking.check_in_date)} 
                            {booking.booking_type === 'day_tour' ? ' (Day Tour)' : ` to ${formatDate(booking.check_out_date)}`}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Select New Room Unit
                        </label>
                        {loadingUnits ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm text-gray-600">Loading available units...</span>
                            </div>
                        ) : (
                            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a room unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUnits.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No available units found
                                        </div>
                                    ) : (
                                        availableUnits
                                            .filter(unit => unit && unit.id && unit.unit_number)
                                            .map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                    Unit {unit.unit_number}
                                                    {unit.notes && ` (${unit.notes})`}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleChangeRoomUnit}
                            disabled={loading || !selectedUnitId || availableUnits.length === 0}
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Change Unit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChangeRoomUnitDialog;
