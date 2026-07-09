import { LayoutList, Rows3, PanelTop } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CART_LIST_VIEWS } from './cartRoomUtils';

const VIEW_ICONS = {
    detailed: LayoutList,
    compact: Rows3,
    accordion: PanelTop,
};

export default function CartListViewToggle({ value, onChange }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-sm text-gray-600">
                {CART_LIST_VIEWS[value]?.description}
            </p>
            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(next) => next && onChange(next)}
                variant="outline"
                size="sm"
                className="bg-white"
            >
                {Object.values(CART_LIST_VIEWS).map((view) => {
                    const Icon = VIEW_ICONS[view.id];
                    return (
                        <ToggleGroupItem
                            key={view.id}
                            value={view.id}
                            aria-label={view.label}
                            className="px-3 gap-1.5 data-[state=on]:bg-sky-50 data-[state=on]:text-sky-800"
                        >
                            <Icon className="size-4 shrink-0" />
                            <span className="hidden sm:inline">{view.label}</span>
                        </ToggleGroupItem>
                    );
                })}
            </ToggleGroup>
        </div>
    );
}
