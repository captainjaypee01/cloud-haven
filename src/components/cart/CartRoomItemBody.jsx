import { Controller } from 'react-hook-form';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { GuestSelector } from '@/components/GuestSelector';
import { formatCurrency } from '@/utils/currency';
import {
    formatMealDate,
    formatBuffetDateRange,
    getBuffetMealLabels,
} from '@/utils/dateUtils';
import { ExtraGuestFeeBreakdown } from './ExtraGuestFeeBreakdown';
import { getRoomLineTotal } from './cartRoomUtils';

export default function CartRoomItemBody({
    item,
    control,
    numNights,
    isDayTourCart,
    dayTourMealData,
    mealQuote,
    removeItem,
    handleChange,
    handleView,
    handleAddAnotherRoom,
    handleMealOptionChange,
    showHeader = true,
    showSubtotal = true,
}) {
    const lineTotal = getRoomLineTotal(item, isDayTourCart);

    return (
        <>
            {showHeader && (
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">{item.name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {isDayTourCart
                                ? `${formatCurrency(item.pricePerPax)} per person • ${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''}`
                                : `${formatCurrency(item.price)} / night • ${numNights} night${numNights > 1 ? 's' : ''}`}
                        </p>
                        <p className="text-xs text-gray-500">Max {item.maxGuests} guests</p>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.uniqueId)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                        <Trash size={18} />
                    </Button>
                </div>
            )}

            <div className="flex justify-between gap-2 flex-wrap">
                <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddAnotherRoom(item)}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Another Room
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(item.roomId)}
                    className="cursor-pointer"
                >
                    View Room
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor={`adults-${item.uniqueId}`} className="block text-sm font-medium mb-1">
                        Adults
                    </label>
                    <Controller
                        name={`adults-${item.uniqueId}`}
                        control={control}
                        render={({ field }) => (
                            <GuestSelector
                                name={field.name}
                                minGuests={item.roomType === 'day_tour' ? 1 : 0}
                                maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
                                value={field.value ?? ''}
                                onChange={(v) => handleChange(item, 'adults', v)}
                            />
                        )}
                    />
                </div>
                <div>
                    <label htmlFor={`children-${item.uniqueId}`} className="block text-sm font-medium mb-1">
                        Children (4-6 years old)
                    </label>
                    <Controller
                        name={`children-${item.uniqueId}`}
                        control={control}
                        render={({ field }) => (
                            <GuestSelector
                                name={field.name}
                                minGuests={0}
                                maxGuests={parseInt(item.maxGuests) + parseInt(item.extraGuests)}
                                value={field.value ?? ''}
                                onChange={(v) => handleChange(item, 'children', v)}
                            />
                        )}
                    />
                    <div className="text-sm text-gray-600">
                        <span>3 years old and below are free of charge.</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between text-sm mt-4">
                <span>{isDayTourCart ? 'Day Tour Price:' : 'Room Price:'}</span>
                <span>
                    {isDayTourCart
                        ? `${formatCurrency(item.pricePerPax)} × ${item.totalGuests} guest${item.totalGuests > 1 ? 's' : ''} = ${formatCurrency(item.basePrice || item.pricePerPax * item.totalGuests)}`
                        : `${formatCurrency(item.price)} x ${numNights} night${numNights > 1 ? 's' : ''} = ${formatCurrency(item.subtotal)}`}
                </span>
            </div>

            {!isDayTourCart &&
                item.totalGuests > parseInt(item.maxGuests) &&
                mealQuote?.nights?.some((night) => night.type === 'free_breakfast') && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                        ⚠️ You have {item.totalGuests - parseInt(item.maxGuests)} extra guest
                        {item.totalGuests - parseInt(item.maxGuests) > 1 ? 's' : ''} who may incur additional
                        breakfast fees on free breakfast days
                    </div>
                )}

            {isDayTourCart && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3 space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Meal Add-ons</h5>
                    <DayTourMealOptions
                        item={item}
                        dayTourMealData={dayTourMealData}
                        handleMealOptionChange={handleMealOptionChange}
                    />
                </div>
            )}

            {!isDayTourCart && item.hasRoomMealBreakdown && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h6 className="text-sm font-medium text-blue-700 mb-2">Meal Breakdown for this Room</h6>
                    <div className="space-y-3">
                        {item.mealBreakdown.map((mealNight, index) => (
                            <div key={index} className="border-b border-blue-200 pb-3 last:border-b-0 last:pb-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-blue-700">
                                            {mealNight.type === 'buffet'
                                                ? formatBuffetDateRange(mealNight.startDate, mealNight.endDate)
                                                : formatMealDate(mealNight.endDate)}
                                        </span>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {mealNight.type === 'buffet'
                                                ? getBuffetMealLabels(mealNight.startDate, mealNight.endDate)
                                                : 'Free Breakfast (Plated)'}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-900">
                                        {formatCurrency(mealNight.cost)}
                                    </span>
                                </div>
                                {mealNight.type === 'buffet' ? (
                                    <div className="ml-4 space-y-1 text-xs text-blue-600">
                                        {item.adults > 0 && (
                                            <div className="flex justify-between">
                                                <span>
                                                    {item.adults} Adult{item.adults > 1 ? 's' : ''} at{' '}
                                                    {formatCurrency(mealNight.adultPrice)} each
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(item.adults * mealNight.adultPrice)}
                                                </span>
                                            </div>
                                        )}
                                        {item.children > 0 && (
                                            <div className="flex justify-between">
                                                <span>
                                                    {item.children} Child{item.children > 1 ? 'ren' : ''} at{' '}
                                                    {formatCurrency(mealNight.childPrice)} each
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(item.children * mealNight.childPrice)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ml-4 space-y-1 text-xs text-blue-600">
                                        <div className="flex justify-between">
                                            <span className="text-green-600">
                                                {Math.max(0, item.adults + item.children - mealNight.extraGuests)}{' '}
                                                Guest
                                                {Math.max(0, item.adults + item.children - mealNight.extraGuests) > 1
                                                    ? 's'
                                                    : ''}{' '}
                                                — Complimentary Breakfast (Plated)
                                            </span>
                                            <span className="font-medium text-green-600">Free</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="pt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-blue-800">Room Meal Total:</span>
                                <span className="text-sm font-bold text-green-600">
                                    {formatCurrency(item.roomMealTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isDayTourCart && item.hasExtraGuestBreakdown && (
                <ExtraGuestFeeBreakdown items={item.extraGuestBreakdown} />
            )}

            {showSubtotal && (
                <>
                    <div className="flex justify-between font-medium">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(lineTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Total Guests:</span>
                        <span>{item.totalGuests}</span>
                    </div>
                </>
            )}
        </>
    );
}

function DayTourMealOptions({ item, dayTourMealData, handleMealOptionChange }) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id={`lunch-${item.uniqueId}`}
                        checked={item.includeLunch || false}
                        onCheckedChange={(checked) => handleMealOptionChange(item, 'lunch', checked)}
                        disabled={!dayTourMealData?.buffet_active}
                        className="cursor-pointer"
                    />
                    <div>
                        <label
                            htmlFor={`lunch-${item.uniqueId}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                            Buffet Lunch
                            {!dayTourMealData?.buffet_active && (
                                <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                            )}
                        </label>
                        {item.includeLunch && dayTourMealData?.lunch_prices && (
                            <div className="text-xs text-gray-600">
                                {item.adults} adult{item.adults > 1 ? 's' : ''} ×{' '}
                                {formatCurrency(dayTourMealData.lunch_prices.adult)}
                                {item.children > 0 && (
                                    <>
                                        {' '}
                                        + {item.children} child{item.children > 1 ? 'ren' : ''} ×{' '}
                                        {formatCurrency(dayTourMealData.lunch_prices.child)}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <span className="text-sm font-semibold text-green-600">
                    {item.includeLunch && item.lunchCost > 0 ? formatCurrency(item.lunchCost) : '—'}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id={`pmSnack-${item.uniqueId}`}
                        checked={item.includePmSnack || false}
                        onCheckedChange={(checked) => handleMealOptionChange(item, 'pmSnack', checked)}
                        disabled={dayTourMealData?.pm_snack_policy === 'hidden'}
                        className="cursor-pointer"
                    />
                    <div>
                        <label
                            htmlFor={`pmSnack-${item.uniqueId}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                            PM Snack
                            {dayTourMealData?.pm_snack_policy === 'optional' && (
                                <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                            )}
                            {dayTourMealData?.pm_snack_policy === 'hidden' && (
                                <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                            )}
                            {dayTourMealData?.pm_snack_policy === 'required' && (
                                <span className="ml-2 text-xs text-orange-600">(Required)</span>
                            )}
                        </label>
                        {item.includePmSnack && dayTourMealData?.pm_snack_prices && (
                            <div className="text-xs text-gray-600">
                                {item.adults} adult{item.adults > 1 ? 's' : ''} ×{' '}
                                {formatCurrency(dayTourMealData.pm_snack_prices.adult)}
                                {item.children > 0 && (
                                    <>
                                        {' '}
                                        + {item.children} child{item.children > 1 ? 'ren' : ''} ×{' '}
                                        {formatCurrency(dayTourMealData.pm_snack_prices.child)}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <span className="text-sm font-semibold text-green-600">
                    {item.includePmSnack && item.pmSnackCost > 0 ? formatCurrency(item.pmSnackCost) : '—'}
                </span>
            </div>

            {item.mealCost > 0 && (
                <div className="flex justify-between font-medium pt-2 border-t border-gray-300">
                    <span>Meal Total:</span>
                    <span className="text-blue-600">{formatCurrency(item.mealCost)}</span>
                </div>
            )}
        </>
    );
}
