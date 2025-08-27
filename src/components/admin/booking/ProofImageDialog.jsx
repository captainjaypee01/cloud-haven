import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const ProofImageDialog = ({ open, onOpenChange, imageUrl, paymentInfo }) => {
    const handleDownload = () => {
        if (!imageUrl) return;
        
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `proof-${paymentInfo?.id || 'payment'}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Proof of Payment</DialogTitle>
                            {paymentInfo && (
                                <div className="text-sm text-muted-foreground mt-1">
                                    <div>Amount: <span className="font-medium">₱{paymentInfo.amount}</span></div>
                                    <div>Provider: <span className="font-medium">{paymentInfo.provider}</span></div>
                                    {paymentInfo.transaction_id && (
                                        <div>Reference: <span className="font-medium">{paymentInfo.transaction_id}</span></div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="px-4 pb-4">
                    {imageUrl ? (
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt="Proof of Payment"
                                className="w-full max-h-[70vh] object-contain rounded-lg border"
                                onError={(e) => {
                                    e.target.src = "/placeholder-image.png"; // fallback
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                            <p className="text-muted-foreground">No image available</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProofImageDialog;
