import { formatCurrency } from '@/utils/currency';
import { formatBuffetDate, formatMealDate } from '@/utils/dateUtils';

/**
 * Additional guest fees — shown separately from meals.
 * Covers entrance, amenities, and related services for guests beyond room capacity.
 */
export function ExtraGuestFeeBreakdown({
    items = [],
    title = 'Additional Guest Fees',
    compact = false,
    className = '',
}) {
    if (!items?.length) return null;

    const total = items.reduce((sum, row) => sum + (row.total || 0), 0);
    const padding = compact ? 'p-2' : 'p-3';
    const titleClass = compact ? 'text-xs' : 'text-sm';

    return (
        <div className={`mt-3 ${padding} bg-amber-50 rounded-lg border border-amber-100 ${className}`}>
            <h6 className={`${titleClass} font-medium text-amber-900 mb-1`}>{title}</h6>
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-amber-800/80 mb-2 leading-relaxed`}>
                For guests beyond room capacity. Includes entrance, amenities, and related services.
            </p>
            <div className="space-y-2">
                {items.map((row, index) => {
                    const dateLabel = row.type === 'buffet'
                        ? formatBuffetDate(row.date)
                        : formatMealDate(row.endDate || row.date);

                    return (
                        <div
                            key={`${row.date}-${index}`}
                            className="border-b border-amber-200/80 pb-2 last:border-b-0 last:pb-0"
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <span className={`${titleClass} font-medium text-amber-900 block`}>
                                        {dateLabel}
                                    </span>
                                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-amber-800`}>
                                        {row.extraGuests} extra guest{row.extraGuests > 1 ? 's' : ''}
                                        {row.type === 'buffet' ? ' · buffet day' : ''}
                                    </span>
                                </div>
                                <span className={`${titleClass} font-semibold text-amber-900 shrink-0`}>
                                    {formatCurrency(row.total)}
                                </span>
                            </div>
                            {!compact && (
                                <div className="ml-1 mt-1 text-xs text-amber-700">
                                    {formatCurrency(row.feePerGuest)} per extra guest
                                </div>
                            )}
                        </div>
                    );
                })}
                <div className={`pt-1 flex justify-between items-center border-t border-amber-200/80 ${compact ? 'text-xs' : 'text-sm'}`}>
                    <span className="font-semibold text-amber-900">Total additional guest fees</span>
                    <span className="font-bold text-amber-900">{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Cart-level extra guest summary (aggregated across rooms).
 */
export function ExtraGuestFeeSummary({ nights = [], summary = [], compact = false }) {
    const items = [];

    nights.forEach((night) => {
        const totalExtraGuests = summary.reduce((roomTotal, item) => {
            const extraGuestsInRoom = Math.max(0, item.totalGuests - parseInt(item.maxGuests, 10));
            return roomTotal + extraGuestsInRoom;
        }, 0);

        if (totalExtraGuests <= 0) return;

        if (night.type === 'buffet' && night.extra_guest_fee > 0) {
            items.push({
                date: night.date,
                endDate: night.end_date,
                type: 'buffet',
                extraGuests: totalExtraGuests,
                feePerGuest: night.extra_guest_fee,
                total: night.extra_guest_fee_total ?? totalExtraGuests * night.extra_guest_fee,
            });
        } else if (night.type === 'free_breakfast' && (night.extra_guest_fee_total ?? 0) > 0) {
            items.push({
                date: night.date,
                endDate: night.end_date,
                type: 'free_breakfast',
                extraGuests: night.extra_adults || totalExtraGuests,
                feePerGuest: night.adult_breakfast_price || 0,
                total: night.extra_guest_fee_total,
            });
        }
    });

    return <ExtraGuestFeeBreakdown items={items} compact={compact} />;
}
