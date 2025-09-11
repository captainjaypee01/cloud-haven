import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectLabel,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ControlsToolbar({
    search, setSearch,
    searchLabel = "Search…",
    filters = [], // [{ key, label, options: [{value, label}], value, onChange }]
    // sorts = [],   // [{ value, label }]
    onExport
}) {
    return (
        <div className="flex flex-wrap gap-2 items-center mb-4">
            <Input placeholder={searchLabel} value={search} onChange={e => setSearch(e.target.value)} />
            {/* {sorts.options.length > 0 && (
                <Select value={sorts.selected} onValueChange={val => sorts.onChange(val)}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                        {sorts.options.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            )} */}
            {filters.map(f => (
                <Select key={f.key} value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder={f.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {f.options.map(opt => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            ))}
            {onExport && <Button onClick={onExport}>Export</Button>}
        </div>
    );
}
