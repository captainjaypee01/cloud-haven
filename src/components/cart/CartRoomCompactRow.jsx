import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import CartRoomItemBody from './CartRoomItemBody';
import { formatGuestSummary, getRoomLineTotal } from './cartRoomUtils';

export default function CartRoomCompactRow({
    item,
    numNights,
    isDayTourCart,
    ...bodyProps
}) {
    const [expanded, setExpanded] = useState(false);
    const lineTotal = getRoomLineTotal(item, isDayTourCart);
    const roomAmount = isDayTourCart ? item.basePrice || item.pricePerPax * item.totalGuests : item.subtotal;
    const mealAmount = isDayTourCart ? item.mealCost || 0 : item.roomMealTotal || 0;
    const extraAmount = isDayTourCart ? 0 : item.roomExtraGuestFeeTotal || 0;

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div className="flex items-center gap-2 p-3 md:px-4 md:py-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatGuestSummary(item)}</p>
                </div>

                <div className="hidden md:grid md:grid-cols-4 md:gap-4 md:text-right text-xs shrink-0">
                    <div>
                        <p className="text-gray-500">Room</p>
                        <p className="font-medium">{formatCurrency(roomAmount)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Meals</p>
                        <p className="font-medium">{mealAmount > 0 ? formatCurrency(mealAmount) : '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Extra</p>
                        <p className="font-medium text-amber-700">
                            {extraAmount > 0 ? formatCurrency(extraAmount) : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-semibold">{formatCurrency(lineTotal)}</p>
                    </div>
                </div>

                <div className="md:hidden text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(lineTotal)}</p>
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-gray-600"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Collapse room details' : 'Expand room details'}
                >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => bodyProps.removeItem(item.uniqueId)}
                    className="text-red-600 hover:text-red-800 shrink-0"
                >
                    <Trash size={16} />
                </Button>
            </div>

            {expanded && (
                <div className="border-t bg-gray-50 p-4 space-y-4">
                    <CartRoomItemBody
                        item={item}
                        numNights={numNights}
                        isDayTourCart={isDayTourCart}
                        showHeader={false}
                        showSubtotal={false}
                        {...bodyProps}
                    />
                    <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Line total</span>
                        <span>{formatCurrency(lineTotal)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
