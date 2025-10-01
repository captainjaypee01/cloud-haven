// components/admin/booking/BookingPrintButton.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Settings, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { printBookingReceipt, downloadBookingReceipt, PRINT_PRESETS } from '@/utils/printUtils';

const BookingPrintButton = ({ booking, className = "", variant = "outline", size = "default" }) => {
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [sections, setSections] = useState({
        header: true,
        guestInfo: true,
        bookingDetails: true,
        pricing: true,
        rooms: true,
        meals: true,
        payments: true,
        cancellation: true,
        footer: true
    });

    const handlePrint = () => {
        printBookingReceipt(booking, { sections });
        setPrintDialogOpen(false);
    };

    const handleDownload = () => {
        downloadBookingReceipt(booking, { sections });
        setPrintDialogOpen(false);
    };

    const handleSectionToggle = (sectionName) => {
        setSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const handlePresetChange = (presetName) => {
        if (presetName && PRINT_PRESETS[presetName]) {
            setSections(PRINT_PRESETS[presetName]);
        }
    };

    const sectionLabels = {
        header: 'Header & Title',
        guestInfo: 'Guest Information',
        bookingDetails: 'Booking Details',
        pricing: 'Price Breakdown',
        rooms: 'Room Details',
        meals: 'Meal Information',
        payments: 'Payment History',
        cancellation: 'Cancellation Details',
        footer: 'Footer'
    };

    return (
        <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    className={`cursor-pointer ${className}`}
                    variant={variant}
                    size={size}
                >
                    <Printer className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Print Receipt</span>
                    <span className="sm:hidden">Print</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Print Receipt Options
                    </DialogTitle>
                    <DialogDescription>
                        Select which sections to include in the printed receipt. You can use presets or customize individual sections.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {/* Preset Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Quick Presets</Label>
                        <Select onValueChange={handlePresetChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a preset..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Receipt (All Sections)</SelectItem>
                                <SelectItem value="CUSTOMER">Customer Receipt (No Payment Details)</SelectItem>
                                <SelectItem value="SIMPLE">Simple Receipt (Basic Info Only)</SelectItem>
                                <SelectItem value="PAYMENT_SUMMARY">Payment Summary Only</SelectItem>
                                <SelectItem value="ROOM_DETAILS">Room Details Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Individual Section Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Customize Sections</Label>
                        <div className="space-y-3">
                            {Object.entries(sectionLabels).map(([key, label]) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={key}
                                        checked={sections[key]}
                                        onCheckedChange={() => handleSectionToggle(key)}
                                    />
                                    <Label 
                                        htmlFor={key}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        <strong>Note:</strong> The receipt will be opened in a new window for printing. 
                        You can use your browser's print dialog to save as PDF or print to paper.
                    </div>
                </div>
                
                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPrintDialogOpen(false)}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        className="cursor-pointer"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download HTML
                    </Button>
                    <Button
                        onClick={handlePrint}
                        className="cursor-pointer"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BookingPrintButton;
