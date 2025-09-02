import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X, ZoomIn, ZoomOut, RotateCw, Calendar, CreditCard, Hash } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

const ProofImageDialog = ({ open, onOpenChange, imageUrl, paymentInfo }) => {
    const [imageScale, setImageScale] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);
    
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
    
    const handleZoomIn = () => {
        setImageScale(prev => Math.min(prev + 0.25, 3));
    };
    
    const handleZoomOut = () => {
        setImageScale(prev => Math.max(prev - 0.25, 0.5));
    };
    
    const handleRotate = () => {
        setImageRotation(prev => (prev + 90) % 360);
    };
    
    const resetTransforms = () => {
        setImageScale(1);
        setImageRotation(0);
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Under Review</Badge>;
            case 'accepted':
                return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Accepted</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) resetTransforms(); }}>
            <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <DialogTitle className="text-xl font-semibold">Proof of Payment</DialogTitle>
                            {paymentInfo && (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-semibold text-lg">{formatCurrency(paymentInfo.amount)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Provider:</span>
                                            <span className="font-medium">{paymentInfo.provider}</span>
                                        </div>
                                        {paymentInfo.transaction_id && (
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Reference:</span>
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{paymentInfo.transaction_id}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3">
                                        {paymentInfo.proof_status && getStatusBadge(paymentInfo.proof_status)}
                                        {paymentInfo.local_created_at && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {paymentInfo.local_created_at}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomOut}
                                disabled={imageScale <= 0.5}
                                title="Zoom Out"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleZoomIn}
                                disabled={imageScale >= 3}
                                title="Zoom In"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRotate}
                                title="Rotate"
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                title="Download"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="relative flex-1 overflow-hidden bg-muted/20">
                    {imageUrl ? (
                        <div className="relative h-full min-h-[60vh] flex items-center justify-center p-4">
                            <div 
                                className="relative max-w-full max-h-full overflow-auto"
                                style={{
                                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                                    transition: 'transform 0.2s ease-in-out'
                                }}
                            >
                                <img
                                    src={imageUrl}
                                    alt="Proof of Payment"
                                    className="max-w-none h-auto rounded-lg shadow-lg border bg-white"
                                    style={{
                                        maxHeight: 'calc(80vh - 200px)',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.src = "/placeholder-image.png"; // fallback
                                    }}
                                    draggable={false}
                                />
                            </div>
                            
                            {/* Zoom indicator */}
                            {imageScale !== 1 && (
                                <div className="absolute top-4 left-4 bg-black/75 text-white px-2 py-1 rounded text-xs font-mono">
                                    {Math.round(imageScale * 100)}%
                                </div>
                            )}
                            
                            {/* Reset button */}
                            {(imageScale !== 1 || imageRotation !== 0) && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={resetTransforms}
                                        className="bg-black/75 text-white hover:bg-black/85"
                                    >
                                        Reset View
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-1">No image available</h3>
                                <p className="text-muted-foreground text-sm">The proof of payment image could not be loaded.</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProofImageDialog;
