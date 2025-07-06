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
import { motion, AnimatePresence } from "framer-motion";

const AvailabilityModal = ({ open, items, onClose, onRefresh, checking }) => {
    return (
        <AnimatePresence>
            {open && (
                <Dialog open={open} onOpenChange={onClose}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="text-destructive" size={22} />
                                <DialogTitle>Room Availability Issue</DialogTitle>
                            </div>
                            <DialogDescription>
                                One or more rooms are no longer available in the quantity you selected.
                            </DialogDescription>
                        </DialogHeader>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ duration: 0.25 }}
                            className="py-2"
                        >
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
                                            Only {item.available_count} left
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="secondary" onClick={onClose} className="cursor-pointer">
                                Back to Cart
                            </Button>
                            {onRefresh && (
                                <Button onClick={onRefresh} variant="outline" disabled={checking} className="cursor-pointer">
                                    Retry
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => window.location.href = '/rooms'} className="cursor-pointer">
                                View All Rooms
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}

export default AvailabilityModal;
