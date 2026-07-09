import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/utils/currency';
import { fetchPricingCalendar, previewPricingBulk, updatePricingCalendar } from '@/services/roomPricing';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Pin, ArrowLeft, CalendarDays, MousePointerClick, UnfoldHorizontal } from 'lucide-react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    getDay,
    parseISO,
    differenceInCalendarDays,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FIELDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const emptyWeekdayPrices = () => ({
    sun: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '',
});

const priceBucketClass = (price, min, max) => {
    if (max === min) return 'bg-slate-50 hover:bg-slate-100';
    const ratio = (price - min) / (max - min);
    if (ratio < 0.25) return 'bg-emerald-50 hover:bg-emerald-100';
    if (ratio < 0.5) return 'bg-sky-50 hover:bg-sky-100';
    if (ratio < 0.75) return 'bg-amber-50 hover:bg-amber-100';
    return 'bg-rose-50 hover:bg-rose-100';
};

const isContiguousRange = (dates) => {
    const sorted = [...dates].sort();
    if (sorted.length <= 1) return true;
    for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]));
        if (diff !== 1) return false;
    }
    return true;
};

const formatSelectionSummary = (dates) => {
    const sorted = [...dates].sort();
    if (sorted.length === 0) return null;
    if (sorted.length === 1) {
        return format(parseISO(sorted[0]), 'MMM d, yyyy');
    }
    if (isContiguousRange(sorted)) {
        return `${format(parseISO(sorted[0]), 'MMM d')} → ${format(parseISO(sorted[sorted.length - 1]), 'MMM d, yyyy')}`;
    }
    const labels = sorted.map((d) => format(parseISO(d), 'MMM d'));
    if (labels.length <= 4) return labels.join(', ');
    return `${sorted.length} separate days: ${labels.slice(0, 3).join(', ')}, …`;
};

const Field = ({ label, htmlFor, hint, children }) => (
    <div className="space-y-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
        </Label>
        {children}
        {hint ? <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p> : null}
    </div>
);

const CurrentPricesSummary = ({ breakdown }) => {
    if (!breakdown?.items?.length) return null;

    if (breakdown.allSame) {
        return (
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Current price: </span>
                <span className="font-semibold">{formatCurrency(breakdown.sharedPrice)}</span>
                <span className="text-muted-foreground"> / night on all selected days</span>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-2">
            <p className="text-sm font-medium">Current prices (vary by day)</p>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {breakdown.items.map(({ date, price, isPinned }) => (
                    <div key={date} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground shrink-0">
                            {format(parseISO(date), 'MMM d, yyyy')}
                        </span>
                        <span className="font-medium text-right">
                            {formatCurrency(price)}
                            {isPinned ? (
                                <span className="text-muted-foreground font-normal"> · pinned</span>
                            ) : null}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RoomPricingCalendar = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const api = useApi();

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [calendar, setCalendar] = useState(null);
    const [loading, setLoading] = useState(false);

    // selectionMode: 'range' (start → end) or 'individual' (toggle separate days)
    const [selectionMode, setSelectionMode] = useState('range');
    const [rangeAnchor, setRangeAnchor] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);

    // Sheets
    const [editOpen, setEditOpen] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);

    // Form state
    const [editPrice, setEditPrice] = useState('');
    const [flatPrice, setFlatPrice] = useState('');
    const [weekdayPrices, setWeekdayPrices] = useState(emptyWeekdayPrices);
    const [monthFlatPrice, setMonthFlatPrice] = useState('');
    const [monthWeekdayPrices, setMonthWeekdayPrices] = useState(emptyWeekdayPrices);
    const [skipOverrides, setSkipOverrides] = useState(true);
    const [preview, setPreview] = useState(null);
    const [monthPreview, setMonthPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toolsTab, setToolsTab] = useState('flat');
    const [monthTab, setMonthTab] = useState('flat');

    const monthKey = format(currentMonth, 'yyyy-MM');
    const monthFrom = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthTo = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const loadCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPricingCalendar(api, roomId, monthKey);
            setCalendar(data);
        } catch {
            toast.error('Failed to load pricing calendar');
        } finally {
            setLoading(false);
        }
    }, [api, roomId, monthKey]);

    useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);

    // Clear selection when changing months so range doesn't span confusingly
    useEffect(() => {
        setRangeAnchor(null);
        setSelectedDates([]);
        setPreview(null);
    }, [monthKey]);

    const daysMap = useMemo(() => {
        const map = {};
        (calendar?.days || []).forEach((d) => { map[d.date] = d; });
        return map;
    }, [calendar]);

    const priceRange = useMemo(() => {
        const prices = (calendar?.days || []).map((d) => d.price_per_night);
        if (!prices.length) return { min: 0, max: 0 };
        return { min: Math.min(...prices), max: Math.max(...prices) };
    }, [calendar]);

    const monthDays = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth),
        });
    }, [currentMonth]);

    const leadingBlanks = getDay(startOfMonth(currentMonth));
    const selectionCount = selectedDates.length;
    const isSingleSelection = selectionCount === 1;
    const sortedSelection = useMemo(() => [...selectedDates].sort(), [selectedDates]);
    const selectionIsContiguous = isContiguousRange(sortedSelection);
    const selectionLabel = formatSelectionSummary(selectedDates);

    const getDatePrice = useCallback((dateStr) => {
        const dayData = daysMap[dateStr];
        return dayData?.price_per_night ?? calendar?.room?.default_price_per_night ?? 0;
    }, [daysMap, calendar]);

    const selectedPriceBreakdown = useMemo(() => {
        const items = sortedSelection.map((date) => ({
            date,
            price: getDatePrice(date),
            isPinned: daysMap[date]?.is_manual_override ?? false,
        }));
        const uniquePrices = new Set(items.map((i) => i.price));
        return {
            items,
            allSame: uniquePrices.size <= 1,
            sharedPrice: items[0]?.price ?? 0,
        };
    }, [sortedSelection, getDatePrice, daysMap]);

    const datesBetween = (startStr, endStr) => {
        const start = startStr < endStr ? startStr : endStr;
        const end = startStr < endStr ? endStr : startStr;
        return monthDays
            .map((d) => format(d, 'yyyy-MM-dd'))
            .filter((ds) => ds >= start && ds <= end);
    };

    const clearSelection = () => {
        setRangeAnchor(null);
        setSelectedDates([]);
        setPreview(null);
    };

    const handleSelectionModeChange = (mode) => {
        if (!mode || mode === selectionMode) return;
        setSelectionMode(mode);
        clearSelection();
    };

    const handleRangeDayClick = (dateStr) => {
        if (!rangeAnchor) {
            setRangeAnchor(dateStr);
            setSelectedDates([dateStr]);
            return;
        }

        if (rangeAnchor === dateStr) {
            setSelectedDates([dateStr]);
            setRangeAnchor(null);
            return;
        }

        setSelectedDates(datesBetween(rangeAnchor, dateStr));
        setRangeAnchor(null);
    };

    const handleIndividualDayClick = (dateStr) => {
        setRangeAnchor(null);
        setSelectedDates((prev) => {
            if (prev.includes(dateStr)) {
                return prev.filter((d) => d !== dateStr);
            }
            return [...prev, dateStr].sort();
        });
    };

    const handleDayClick = (dateStr) => {
        if (selectionMode === 'individual') {
            handleIndividualDayClick(dateStr);
            return;
        }
        handleRangeDayClick(dateStr);
    };

    const openEditSelected = () => {
        if (selectionCount === 0) return;

        if (isSingleSelection) {
            const dateStr = selectedDates[0];
            const dayData = daysMap[dateStr];
            setEditPrice(String(dayData?.price_per_night ?? calendar?.room?.default_price_per_night ?? ''));
            setEditOpen(true);
            return;
        }

        setFlatPrice(
            selectedPriceBreakdown.allSame
                ? String(selectedPriceBreakdown.sharedPrice)
                : ''
        );
        setWeekdayPrices(emptyWeekdayPrices());
        setPreview(null);
        setToolsTab('flat');
        setToolsOpen(true);
    };

    const openMonthTools = () => {
        setMonthFlatPrice('');
        setMonthWeekdayPrices(emptyWeekdayPrices());
        setMonthPreview(null);
        setMonthTab('flat');
        setMonthOpen(true);
    };

    const buildWeekdayPayload = (prices) =>
        Object.fromEntries(
            WEEKDAY_FIELDS.map((k) => [k, prices[k] === '' ? null : parseFloat(prices[k])])
        );

    const saveSingleDay = async () => {
        if (!selectedDates[0] || editPrice === '') {
            toast.error('Enter a price');
            return;
        }
        setSaving(true);
        try {
            await updatePricingCalendar(api, roomId, {
                mode: 'single',
                date: selectedDates[0],
                price_per_night: parseFloat(editPrice),
                is_manual_override: true,
            });
            toast.success('Day price updated');
            setEditOpen(false);
            clearSelection();
            loadCalendar();
        } catch {
            toast.error('Failed to save price');
        } finally {
            setSaving(false);
        }
    };

    const previewForDates = async ({ mode, dates, price, weekdays }) => {
        const sorted = [...dates].sort();
        const contiguous = isContiguousRange(sorted);

        if (mode === 'weekday_pattern' && !contiguous) {
            toast.error('Weekday patterns need a continuous range. Use range mode or same price for separate days.');
            return null;
        }

        if (mode === 'flat' && (price === '' || Number.isNaN(parseFloat(price)))) {
            toast.error('Enter a price');
            return null;
        }

        const weekdayPayload = buildWeekdayPayload(weekdays);
        const targets = contiguous
            ? [{ from: sorted[0], to: sorted[sorted.length - 1] }]
            : sorted.map((date) => ({ from: date, to: date }));

        try {
            let wouldUpdate = 0;
            let wouldSkip = 0;

            for (const { from, to } of targets) {
                const result = await previewPricingBulk(api, roomId, {
                    mode,
                    from,
                    to,
                    skip_manual_overrides: skipOverrides,
                    ...(mode === 'flat'
                        ? { price: parseFloat(price) }
                        : weekdayPayload),
                });
                wouldUpdate += result.would_update ?? 0;
                wouldSkip += result.would_skip ?? 0;
            }

            return { would_update: wouldUpdate, would_skip: wouldSkip };
        } catch {
            toast.error('Preview failed');
            return null;
        }
    };

    const runPreview = async ({ mode, dates, price, weekdays, setResult }) => {
        const result = await previewForDates({ mode, dates, price, weekdays });
        if (result) setResult(result);
    };

    const applyBulk = async ({ mode, dates, price, weekdays, previewResult, onSuccess }) => {
        if (!previewResult) {
            toast.error('Preview changes first');
            return;
        }

        const sorted = [...dates].sort();
        const contiguous = isContiguousRange(sorted);

        if (mode === 'weekday_pattern' && !contiguous) {
            toast.error('Weekday patterns need a continuous range.');
            return;
        }

        setSaving(true);
        try {
            const weekdayPayload = buildWeekdayPayload(weekdays);
            const targets = contiguous
                ? [{ from: sorted[0], to: sorted[sorted.length - 1] }]
                : sorted.map((date) => ({ from: date, to: date }));

            for (const { from, to } of targets) {
                await updatePricingCalendar(api, roomId, {
                    mode,
                    from,
                    to,
                    skip_manual_overrides: skipOverrides,
                    ...(mode === 'flat'
                        ? { price: parseFloat(price) }
                        : weekdayPayload),
                });
            }

            toast.success(
                `Updated ${previewResult.would_update} day${previewResult.would_update === 1 ? '' : 's'}` +
                (previewResult.would_skip ? ` (${previewResult.would_skip} pinned skipped)` : '')
            );
            onSuccess();
            loadCalendar();
        } catch {
            toast.error('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const changeMonth = (next) => {
        setCurrentMonth(next);
    };

    return (
        <div className="space-y-5 pb-24">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/rooms')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Rooms
                </Button>
            </div>

            <Title
                align="left"
                font="outfit"
                title={calendar?.room?.name ? `${calendar.room.name} — Pricing` : 'Room Pricing'}
                subTitle="Choose range or individual selection, pick your days, then use the action bar. Sheets only open when you choose an action."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <ToggleGroup
                        type="single"
                        value={selectionMode}
                        onValueChange={handleSelectionModeChange}
                        variant="outline"
                        size="sm"
                    >
                        <ToggleGroupItem value="range" aria-label="Range selection" className="px-3">
                            <UnfoldHorizontal className="w-4 h-4 mr-1.5" />
                            Range
                        </ToggleGroupItem>
                        <ToggleGroupItem value="individual" aria-label="Individual days" className="px-3">
                            <MousePointerClick className="w-4 h-4 mr-1.5" />
                            Individual days
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeMonth(subMonths(currentMonth, 1))}
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold min-w-[160px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeMonth(addMonths(currentMonth, 1))}
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    </div>
                </div>

                <Button variant="secondary" onClick={openMonthTools}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Price this month
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Default (fallback) rate:{' '}
                        <span className="text-foreground font-semibold">
                            {formatCurrency(calendar?.room?.default_price_per_night ?? 0)}
                        </span>
                        {' '}/ night
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {selectionMode === 'range' ? (
                            rangeAnchor
                                ? `Range start: ${format(parseISO(rangeAnchor), 'MMM d')} — click another day to finish.`
                                : selectionCount > 0
                                    ? `Selected: ${selectionLabel} (${selectionCount} day${selectionCount === 1 ? '' : 's'})`
                                    : 'Click a start day, then an end day to select a range.'
                        ) : (
                            selectionCount > 0
                                ? `Selected: ${selectionLabel} — click a day again to deselect.`
                                : 'Click any days to add them. Click again to remove.'
                        )}
                    </p>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">Loading calendar…</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                                {WEEKDAYS.map((d) => (
                                    <div
                                        key={d}
                                        className="text-center text-xs font-medium text-muted-foreground py-1"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {Array.from({ length: leadingBlanks }).map((_, i) => (
                                    <div key={`blank-${i}`} />
                                ))}
                                {monthDays.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dayData = daysMap[dateStr];
                                    const price =
                                        dayData?.price_per_night ??
                                        calendar?.room?.default_price_per_night ??
                                        0;
                                    const isDefault = dayData?.is_default ?? true;
                                    const isSelected = selectedDates.includes(dateStr);
                                    const isAnchor = rangeAnchor === dateStr;
                                    const bucket = priceBucketClass(price, priceRange.min, priceRange.max);

                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => handleDayClick(dateStr)}
                                            className={`
                                                min-h-[76px] rounded-lg border p-2 text-left text-xs transition
                                                ${bucket}
                                                ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-border/60'}
                                                ${isAnchor && !isSelected ? 'ring-2 ring-primary/40' : ''}
                                                ${isDefault ? 'border-dashed' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-start gap-1">
                                                <span className="font-medium">{format(day, 'd')}</span>
                                                {dayData?.is_manual_override && (
                                                    <Pin
                                                        className="w-3 h-3 text-primary shrink-0"
                                                        title="Pinned — bulk tools skip by default"
                                                    />
                                                )}
                                            </div>
                                            <div className="mt-1.5 font-semibold leading-tight truncate">
                                                {formatCurrency(price)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Pinned day (skipped by bulk unless you opt in)
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-3 h-3 rounded border border-dashed border-muted-foreground/40" />
                                    Using default fallback
                                </span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Sticky action bar — only after the user has selected dates */}
            {selectionCount > 0 && (
                <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                                {isSingleSelection
                                    ? '1 day selected'
                                    : selectionMode === 'individual' && !selectionIsContiguous
                                        ? `${selectionCount} separate days selected`
                                        : `${selectionCount} days selected`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{selectionLabel}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                                Clear
                            </Button>
                            <Button size="sm" onClick={openEditSelected}>
                                {isSingleSelection ? 'Edit this day' : 'Edit selected'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single-day edit */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent className="flex flex-col sm:max-w-md">
                    <SheetHeader className="border-b">
                        <SheetTitle>Edit day price</SheetTitle>
                        <SheetDescription>
                            {selectedDates[0]
                                ? format(parseISO(selectedDates[0]), 'EEEE, MMM d, yyyy')
                                : 'Selected day'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                        <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
                            <span className="text-muted-foreground">Current price: </span>
                            <span className="font-semibold">
                                {formatCurrency(getDatePrice(selectedDates[0]))}
                            </span>
                            <span className="text-muted-foreground"> / night</span>
                        </div>
                        <Field
                            label="New price per night"
                            htmlFor="edit-price"
                            hint="Saving pins this day so bulk / month tools skip it by default."
                        >
                            <Input
                                id="edit-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="h-10"
                            />
                        </Field>
                    </div>

                    <SheetFooter className="border-t">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSingleDay} disabled={saving}>
                            {saving ? 'Saving…' : 'Save day'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Bulk tools for selected range */}
            <Sheet
                open={toolsOpen}
                onOpenChange={(open) => {
                    setToolsOpen(open);
                    if (!open) setPreview(null);
                }}
            >
                <SheetContent className="flex flex-col overflow-hidden sm:max-w-md">
                    <SheetHeader className="border-b">
                        <SheetTitle>Edit selected days</SheetTitle>
                        <SheetDescription>
                            {selectionLabel} · {selectionCount} day{selectionCount === 1 ? '' : 's'}
                            {!selectionIsContiguous && selectionCount > 1 && (
                                <span className="block mt-1">Separate days — use same price, or switch to range mode for weekday patterns.</span>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5">
                        <Tabs
                            value={toolsTab}
                            onValueChange={(v) => { setToolsTab(v); setPreview(null); }}
                        >
                            <TabsList className={`grid w-full mb-5 ${selectionIsContiguous ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <TabsTrigger value="flat">Same price</TabsTrigger>
                                {selectionIsContiguous && (
                                    <TabsTrigger value="weekday">By weekday</TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="flat" className="mt-0 space-y-5">
                                <CurrentPricesSummary breakdown={selectedPriceBreakdown} />
                                <Field
                                    label="New price for every selected day"
                                    htmlFor="flat-price"
                                    hint={
                                        selectedPriceBreakdown.allSame
                                            ? 'All selected days currently share this rate. Enter a new value to replace it.'
                                            : 'This will set the same new price on each selected day.'
                                    }
                                >
                                    <Input
                                        id="flat-price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={flatPrice}
                                        onChange={(e) => setFlatPrice(e.target.value)}
                                        className="h-10"
                                    />
                                </Field>
                            </TabsContent>

                            <TabsContent value="weekday" className="mt-0 space-y-5">
                                <div className="grid grid-cols-1 gap-3">
                                    {WEEKDAY_FIELDS.map((key, i) => (
                                        <div key={key} className="grid grid-cols-[72px_1fr] items-center gap-3">
                                            <Label htmlFor={`wd-${key}`} className="text-sm font-medium">
                                                {WEEKDAYS[i]}
                                            </Label>
                                            <Input
                                                id={`wd-${key}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Skip"
                                                value={weekdayPrices[key]}
                                                onChange={(e) =>
                                                    setWeekdayPrices((p) => ({ ...p, [key]: e.target.value }))
                                                }
                                                className="h-10"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Leave a weekday blank to leave those days unchanged.
                                </p>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-5 flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                            <Checkbox
                                id="skip-selected"
                                checked={skipOverrides}
                                onCheckedChange={(v) => setSkipOverrides(!!v)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="skip-selected" className="text-sm font-normal leading-snug cursor-pointer">
                                Skip pinned days
                                <span className="block text-xs text-muted-foreground mt-1">
                                    Days edited one-by-one stay protected.
                                </span>
                            </Label>
                        </div>

                        {preview && (
                            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
                                Will update <strong>{preview.would_update}</strong> day
                                {preview.would_update === 1 ? '' : 's'}
                                {preview.would_skip > 0 && (
                                    <>, skip <strong>{preview.would_skip}</strong> pinned</>
                                )}
                                .
                            </div>
                        )}
                    </div>

                    <SheetFooter className="border-t gap-2 sm:flex-col">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                                runPreview({
                                    mode: toolsTab === 'flat' ? 'flat' : 'weekday_pattern',
                                    dates: sortedSelection,
                                    price: flatPrice,
                                    weekdays: weekdayPrices,
                                    setResult: setPreview,
                                })
                            }
                        >
                            Preview changes
                        </Button>
                        <Button
                            className="w-full"
                            disabled={!preview || saving}
                            onClick={() =>
                                applyBulk({
                                    mode: toolsTab === 'flat' ? 'flat' : 'weekday_pattern',
                                    dates: sortedSelection,
                                    price: flatPrice,
                                    weekdays: weekdayPrices,
                                    previewResult: preview,
                                    onSuccess: () => {
                                        setToolsOpen(false);
                                        setPreview(null);
                                        clearSelection();
                                    },
                                })
                            }
                        >
                            {saving ? 'Applying…' : 'Apply to selection'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Price entire visible month */}
            <Sheet
                open={monthOpen}
                onOpenChange={(open) => {
                    setMonthOpen(open);
                    if (!open) setMonthPreview(null);
                }}
            >
                <SheetContent className="flex flex-col overflow-hidden sm:max-w-md">
                    <SheetHeader className="border-b">
                        <SheetTitle>Price this month</SheetTitle>
                        <SheetDescription>
                            Apply rates to all of {format(currentMonth, 'MMMM yyyy')} ({monthFrom} → {monthTo}).
                            No need to select days first.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5">
                        <Tabs value={monthTab} onValueChange={(v) => { setMonthTab(v); setMonthPreview(null); }}>
                            <TabsList className="grid w-full grid-cols-2 mb-5">
                                <TabsTrigger value="flat">Same price</TabsTrigger>
                                <TabsTrigger value="weekday">By weekday</TabsTrigger>
                            </TabsList>

                            <TabsContent value="flat" className="mt-0 space-y-5">
                                <Field
                                    label={`Flat rate for ${format(currentMonth, 'MMMM')}`}
                                    htmlFor="month-flat"
                                >
                                    <Input
                                        id="month-flat"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={monthFlatPrice}
                                        onChange={(e) => setMonthFlatPrice(e.target.value)}
                                        className="h-10"
                                    />
                                </Field>
                            </TabsContent>

                            <TabsContent value="weekday" className="mt-0 space-y-5">
                                <div className="grid grid-cols-1 gap-3">
                                    {WEEKDAY_FIELDS.map((key, i) => (
                                        <div key={key} className="grid grid-cols-[72px_1fr] items-center gap-3">
                                            <Label htmlFor={`mwd-${key}`} className="text-sm font-medium">
                                                {WEEKDAYS[i]}
                                            </Label>
                                            <Input
                                                id={`mwd-${key}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Skip"
                                                value={monthWeekdayPrices[key]}
                                                onChange={(e) =>
                                                    setMonthWeekdayPrices((p) => ({
                                                        ...p,
                                                        [key]: e.target.value,
                                                    }))
                                                }
                                                className="h-10"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Leave a weekday blank to leave those days unchanged.
                                </p>
                            </TabsContent>
                        </Tabs>

                        <div className="mt-5 flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                            <Checkbox
                                id="skip-month"
                                checked={skipOverrides}
                                onCheckedChange={(v) => setSkipOverrides(!!v)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="skip-month" className="text-sm font-normal leading-snug cursor-pointer">
                                Skip pinned days
                                <span className="block text-xs text-muted-foreground mt-1">
                                    Protects individually edited nights in this month.
                                </span>
                            </Label>
                        </div>

                        {monthPreview && (
                            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
                                Will update <strong>{monthPreview.would_update}</strong> day
                                {monthPreview.would_update === 1 ? '' : 's'}
                                {monthPreview.would_skip > 0 && (
                                    <>, skip <strong>{monthPreview.would_skip}</strong> pinned</>
                                )}
                                .
                            </div>
                        )}
                    </div>

                    <SheetFooter className="border-t gap-2 sm:flex-col">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                                runPreview({
                                    mode: monthTab === 'flat' ? 'flat' : 'weekday_pattern',
                                    dates: monthDays.map((d) => format(d, 'yyyy-MM-dd')),
                                    price: monthFlatPrice,
                                    weekdays: monthWeekdayPrices,
                                    setResult: setMonthPreview,
                                })
                            }
                        >
                            Preview month changes
                        </Button>
                        <Button
                            className="w-full"
                            disabled={!monthPreview || saving}
                            onClick={() =>
                                applyBulk({
                                    mode: monthTab === 'flat' ? 'flat' : 'weekday_pattern',
                                    dates: monthDays.map((d) => format(d, 'yyyy-MM-dd')),
                                    price: monthFlatPrice,
                                    weekdays: monthWeekdayPrices,
                                    previewResult: monthPreview,
                                    onSuccess: () => {
                                        setMonthOpen(false);
                                        setMonthPreview(null);
                                        clearSelection();
                                    },
                                })
                            }
                        >
                            {saving ? 'Applying…' : `Apply to ${format(currentMonth, 'MMMM')}`}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default RoomPricingCalendar;
