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
import { Copy, CheckCircle2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const OfferDetailsDialog = ({ open, onOpenChange, offer }) => {
    const [copied, setCopied] = useState(false);

    if (!offer) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(offer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
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
                        {offer.expires_at &&
                            <div className="text-xs text-gray-500 mt-2">
                                Valid until {new Date(offer.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        }
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
