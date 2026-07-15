import React from 'react';
import { formatCurrency } from '@/utils/currency';
import { Loader2 } from 'lucide-react';

function BalanceRow({ label, current, proposed, emphasize = false }) {
    const delta = proposed != null && current != null ? proposed - current : null;

    return (
        <div className={`flex items-center justify-between gap-3 text-sm ${emphasize ? 'font-medium' : ''}`}>
            <span className="text-muted-foreground">{label}</span>
            <div className="text-right">
                <span>{formatCurrency(proposed ?? current ?? 0)}</span>
                {delta != null && Math.abs(delta) >= 0.01 && (
                    <span className={`block text-xs ${delta > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                    </span>
                )}
            </div>
        </div>
    );
}

const BookingChangeBalancePreview = ({
    preview,
    loading,
}) => {
    if (loading) {
        return (
            <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating updated balance...
            </div>
        );
    }

    if (!preview?.current || !preview?.proposed) {
        return null;
    }

    const { current, proposed } = preview;

    return (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
            <p className="text-sm font-medium">Balance preview</p>

            <div className="space-y-2">
                <BalanceRow
                    label="Stay total"
                    current={current.net_stay_total}
                    proposed={proposed.net_stay_total}
                />
                <BalanceRow
                    label="Suggested downpayment (50%)"
                    current={current.downpayment_required}
                    proposed={proposed.downpayment_required}
                />
                <BalanceRow label="Amount paid" current={current.amount_paid} proposed={current.amount_paid} />
                <BalanceRow
                    label="Remaining balance"
                    current={current.remaining_balance}
                    proposed={proposed.remaining_balance}
                    emphasize
                />
            </div>
        </div>
    );
};

export default BookingChangeBalancePreview;
