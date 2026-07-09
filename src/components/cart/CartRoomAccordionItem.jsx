import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import CartRoomItemBody from './CartRoomItemBody';
import { formatGuestSummary, formatRoomPriceHint, getRoomLineTotal } from './cartRoomUtils';

export default function CartRoomAccordionItem({
    item,
    numNights,
    isDayTourCart,
    defaultExpanded = false,
    ...bodyProps
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const lineTotal = getRoomLineTotal(item, isDayTourCart);

    return (
        <div className="border rounded-xl overflow-hidden bg-gray-50 shadow-sm">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-100/80 transition-colors"
                aria-expanded={expanded}
            >
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                        {formatGuestSummary(item)} • {formatRoomPriceHint(item, numNights, isDayTourCart)}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-bold">{formatCurrency(lineTotal)}</p>
                    <p className="text-xs text-gray-500">{expanded ? 'Hide' : 'Show'} details</p>
                </div>
                {expanded ? (
                    <ChevronUp className="size-5 text-gray-500 shrink-0" />
                ) : (
                    <ChevronDown className="size-5 text-gray-500 shrink-0" />
                )}
            </button>

            {expanded && (
                <div className="border-t p-4 md:p-6 flex flex-col gap-4 bg-white">
                    <div className="flex justify-end -mt-1 -mb-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => bodyProps.removeItem(item.uniqueId)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <Trash size={18} />
                        </Button>
                    </div>
                    <CartRoomItemBody
                        item={item}
                        numNights={numNights}
                        isDayTourCart={isDayTourCart}
                        showHeader={false}
                        {...bodyProps}
                    />
                </div>
            )}
        </div>
    );
}
