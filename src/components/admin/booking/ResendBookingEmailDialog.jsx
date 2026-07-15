import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

const recommendedEmailType = (status) => {
    if (['downpayment', 'paid'].includes(status)) {
        return 'confirmation';
    }

    return 'reservation';
};

const ResendBookingEmailDialog = ({ open, onOpenChange, booking }) => {
    const api = useApi();
    const [emailType, setEmailType] = useState('reservation');
    const [submitting, setSubmitting] = useState(false);

    const recommended = useMemo(
        () => recommendedEmailType(booking?.status),
        [booking?.status]
    );

    useEffect(() => {
        if (open && booking) {
            setEmailType(recommendedEmailType(booking.status));
        }
    }, [open, booking]);

    const handleSubmit = async () => {
        if (!booking?.id) return;

        setSubmitting(true);
        try {
            const response = await api.post(
                `${API_PREFIX}/admin/bookings/${booking.id}/resend-email`,
                { email_type: emailType },
                { requiresAuth: true }
            );

            toast.success(
                response.data?.message
                || (emailType === 'confirmation'
                    ? 'Booking Confirmation email queued.'
                    : 'Booking Reservation email queued.')
            );
            onOpenChange(false);
        } catch (error) {
            toast.error(
                error.response?.data?.error
                || error.response?.data?.message
                || 'Failed to resend email'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Resend booking email
                    </DialogTitle>
                    <DialogDescription>
                        Send the guest another Reservation or Confirmation email for booking #{booking.reference_number}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">Guest: </span>
                            <span className="font-medium">{booking.guest_name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Email: </span>
                            <span className="font-medium">{booking.guest_email || 'No email on file'}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email-type">Email type</Label>
                        <Select value={emailType} onValueChange={setEmailType}>
                            <SelectTrigger id="email-type" className="w-full">
                                <SelectValue placeholder="Select email type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reservation">
                                    Booking Reservation (awaiting payment / on hold)
                                </SelectItem>
                                <SelectItem value="confirmation">
                                    Booking Confirmation (payment received)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Recommended for current status ({booking.status}):{' '}
                            {recommended === 'confirmation' ? 'Confirmation' : 'Reservation'}
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !booking.guest_email}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            'Send email'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ResendBookingEmailDialog;
