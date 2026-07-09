import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { QuickBookingDialog } from './common/QuickBookingDialog';
import { DayTourAddToCartDialog } from './dayTour/DayTourAddToCartDialog';
import CartRoomItemBody from './cart/CartRoomItemBody';
import CartRoomCompactRow from './cart/CartRoomCompactRow';
import CartRoomAccordionItem from './cart/CartRoomAccordionItem';

const CartList = ({
    summary = [],
    removeItem = () => {},
    handleChange = () => {},
    handleView = () => {},
    control,
    numNights = 1,
    isDayTourCart = false,
    dayTourMealData = null,
    mealQuote = null,
    viewMode = 'detailed',
}) => {
    const { state, updateItem, addItem, currentPricing, mealProgram } = useCart();
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
    const [showDayTourDialog, setShowDayTourDialog] = useState(false);
    const [selectedDayTourRoom, setSelectedDayTourRoom] = useState(null);

    const handleMealOptionChange = (item, option, checked) => {
        const adults = item.adults;
        const children = item.children;
        const total = adults + children;

        let newLunchCost = item.lunchCost || 0;
        let newPmSnackCost = item.pmSnackCost || 0;

        if (option === 'lunch') {
            if (checked && dayTourMealData?.lunch_prices) {
                newLunchCost =
                    adults * dayTourMealData.lunch_prices.adult +
                    children * dayTourMealData.lunch_prices.child;
            } else {
                newLunchCost = 0;
            }
        } else if (option === 'pmSnack') {
            if (checked && dayTourMealData?.pm_snack_prices) {
                newPmSnackCost =
                    adults * dayTourMealData.pm_snack_prices.adult +
                    children * dayTourMealData.pm_snack_prices.child;
            } else {
                newPmSnackCost = 0;
            }
        }

        const newMealCost = newLunchCost + newPmSnackCost;
        const newBasePrice = item.pricePerPax * total;
        const newTotalPrice = newBasePrice + newMealCost;

        const updatedItem = {
            ...(option === 'lunch' ? { includeLunch: checked } : {}),
            ...(option === 'pmSnack' ? { includePmSnack: checked } : {}),
            lunchCost: newLunchCost,
            pmSnackCost: newPmSnackCost,
            mealCost: newMealCost,
            basePrice: newBasePrice,
            price: newTotalPrice,
        };

        updateItem(item.uniqueId, updatedItem);
    };

    const handleAddAnotherRoom = (item) => {
        if (item.roomType === 'day_tour') {
            const dayTourRoom = {
                slug: item.roomId,
                name: item.name,
                price: item.pricePerPax,
                max_guests: parseInt(item.maxGuests),
                extra_guests: parseInt(item.extraGuests),
                min_guests: item.minGuests || 1,
                max_guests_range: item.maxGuestsRange || item.maxGuests,
            };
            setSelectedDayTourRoom(dayTourRoom);
            setShowDayTourDialog(true);
        } else {
            const roomForBooking = {
                slug: item.roomId,
                name: item.name,
                price: item.price,
                max_guests: parseInt(item.maxGuests),
                extra_guests: parseInt(item.extraGuests),
            };
            setSelectedRoomForBooking(roomForBooking);
            setShowBookingDialog(true);
        }
    };

    const sharedBodyProps = {
        control,
        dayTourMealData,
        mealQuote,
        removeItem,
        handleChange,
        handleView,
        handleAddAnotherRoom,
        handleMealOptionChange,
    };

    const renderRooms = () => {
        if (viewMode === 'compact') {
            return (
                <div className="space-y-2">
                    {summary.length > 1 && (
                        <div className="hidden md:grid grid-cols-[1fr_repeat(4,minmax(4rem,5rem))_auto_auto] gap-4 px-4 pb-1 text-xs font-medium text-gray-500">
                            <span>Room</span>
                            <span className="text-right">Room</span>
                            <span className="text-right">Meals</span>
                            <span className="text-right">Extra</span>
                            <span className="text-right">Total</span>
                            <span className="col-span-2" />
                        </div>
                    )}
                    {summary.map((item) => (
                        <CartRoomCompactRow
                            key={item.uniqueId}
                            item={item}
                            numNights={numNights}
                            isDayTourCart={isDayTourCart}
                            {...sharedBodyProps}
                        />
                    ))}
                </div>
            );
        }

        if (viewMode === 'accordion') {
            return (
                <div className="space-y-3">
                    {summary.map((item, index) => (
                        <CartRoomAccordionItem
                            key={item.uniqueId}
                            item={item}
                            numNights={numNights}
                            isDayTourCart={isDayTourCart}
                            defaultExpanded={summary.length === 1 && index === 0}
                            {...sharedBodyProps}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-8">
                {summary.map((item) => (
                    <div
                        key={item.uniqueId}
                        className="border rounded-xl p-4 md:p-6 flex flex-col gap-4 shadow-sm bg-gray-50"
                    >
                        <CartRoomItemBody
                            item={item}
                            numNights={numNights}
                            isDayTourCart={isDayTourCart}
                            {...sharedBodyProps}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {renderRooms()}

            {selectedRoomForBooking && (
                <QuickBookingDialog
                    open={showBookingDialog}
                    onOpenChange={setShowBookingDialog}
                    room={selectedRoomForBooking}
                    availableUnits={undefined}
                    isUnavailable={false}
                    availabilityLoading={false}
                />
            )}

            {selectedDayTourRoom && (
                <DayTourAddToCartDialog
                    open={showDayTourDialog}
                    onOpenChange={setShowDayTourDialog}
                    room={selectedDayTourRoom}
                    currentPricing={currentPricing}
                    availability={mealProgram}
                    selectedDate={state.dayTourDate}
                    onConfirm={(room, adults, children, includeLunch, includePmSnack) => {
                        const totalGuests = adults + children;
                        const pricePerPax = currentPricing?.price_per_pax || room.price || 0;
                        const basePrice = pricePerPax * totalGuests;

                        let lunchCost = 0;
                        let pmSnackCost = 0;

                        if (includeLunch && mealProgram?.buffet_active && mealProgram?.lunch_prices) {
                            lunchCost =
                                adults * mealProgram.lunch_prices.adult +
                                children * mealProgram.lunch_prices.child;
                        }

                        if (includePmSnack && mealProgram?.pm_snack_prices) {
                            pmSnackCost =
                                adults * mealProgram.pm_snack_prices.adult +
                                children * mealProgram.pm_snack_prices.child;
                        }

                        const mealCost = lunchCost + pmSnackCost;
                        const totalPrice = basePrice + mealCost;

                        const cartItem = {
                            roomId: room.slug,
                            name: room.name,
                            price: totalPrice,
                            basePrice,
                            mealCost,
                            lunchCost,
                            pmSnackCost,
                            pricePerPax,
                            adults: parseInt(adults),
                            children: parseInt(children),
                            totalGuests,
                            maxGuests: room.max_guests,
                            extraGuests: room.extra_guests,
                            minGuests: room.min_guests || 1,
                            maxGuestsRange: room.max_guests_range || room.max_guests,
                            roomType: 'day_tour',
                            dayTourDate: state.dayTourDate,
                            includeLunch,
                            includePmSnack: includePmSnack || mealProgram?.pm_snack_policy === 'required',
                        };

                        addItem(cartItem);
                        setShowDayTourDialog(false);
                        setSelectedDayTourRoom(null);
                    }}
                />
            )}
        </>
    );
};

export default CartList;
