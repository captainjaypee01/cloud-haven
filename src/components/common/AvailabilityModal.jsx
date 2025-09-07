import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

const AvailabilityModal = ({ open, items, onClose, onRefresh, checking, isActions = true, isDayTour = false }) => {
    const { navigate } = useAppContext();
    return (
        <AnimatePresence>
            {open && (
                <Dialog open={open} onOpenChange={onClose}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="text-destructive" size={22} />
                                <DialogTitle>{isDayTour ? 'Day Tour Facility Availability Issue' : 'Room Availability Issue'}</DialogTitle>
                            </div>
                            <DialogDescription>
                                {isDayTour 
                                    ? 'One or more Day Tour facilities are no longer available for your selected date.'
                                    : 'One or more rooms are no longer available in the quantity you selected.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                            <ul className="space-y-2">
                                {items.map(item => (
                                    <li
                                        key={item.room_slug}
                                        className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
                                    >
                                        <span className="font-medium flex items-center gap-1">
                                            <AlertTriangle className="text-warning mr-1" size={18} />
                                            {item.room_name || item.room_slug}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {isDayTour ? 'Not available' : `Only ${item.available_count} left`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {isActions && (
                            <DialogFooter className="flex gap-2">
                                <Button variant="secondary" onClick={onClose} className="cursor-pointer">
                                    Back to Cart
                                </Button>
                                {onRefresh && (
                                    <Button onClick={onRefresh} variant="outline" disabled={checking} className="cursor-pointer">
                                        Retry
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={() => navigate(isDayTour ? '/day-tour' : '/rooms')} className="cursor-pointer">
                                    {isDayTour ? 'View Day Tour Facilities' : 'View All Rooms'}
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}

export default AvailabilityModal;