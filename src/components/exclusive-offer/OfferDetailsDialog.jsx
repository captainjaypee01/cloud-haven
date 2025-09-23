import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, X, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const OfferDetailsDialog = ({ open, onOpenChange, offer }) => {
    const [copied, setCopied] = useState(false);

    if (!offer) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(offer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {offer.title}
                        {offer.discount_type === 'percentage'
                            ? <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-800">{offer.discount_value}% OFF</span>
                            : <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{formatCurrency(offer.discount_value)} OFF</span>
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {offer.description}
                    </DialogDescription>
                </DialogHeader>

                {/* Promo Code with Copy */}
                <div className="flex items-center gap-3 mt-4 bg-gray-100 rounded px-3 py-2">
                    <span className="text-lg font-mono tracking-wider">{offer.code}</span>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={handleCopy}
                        type="button"
                        disabled={copied}
                    >
                        {copied
                            ? <><CheckCircle2 className="text-green-600" size={18} /> Copied</>
                            : <><Copy className="text-gray-500" size={18} /> Copy Code</>
                        }
                    </Button>
                </div>

                {/* Date Information */}
                <div className="mt-4 space-y-3">
                    {offer.starts_at && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-900">Starts</p>
                                <p className="text-blue-700 text-sm">{formatDateTime(offer.starts_at)}</p>
                            </div>
                        </div>
                    )}
                    
                    {offer.ends_at && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-900">Ends</p>
                                <p className="text-orange-700 text-sm">{formatDateTime(offer.ends_at)}</p>
                            </div>
                        </div>
                    )}
                    
                    {offer.expires_at && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                            <Clock className="h-4 w-4 text-red-600" />
                            <div>
                                <p className="font-medium text-red-900">Expires</p>
                                <p className="text-red-700 text-sm">{formatDateTime(offer.expires_at)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" className="cursor-pointer">
                            <X size={16} className="mr-1" /> Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OfferDetailsDialog;
