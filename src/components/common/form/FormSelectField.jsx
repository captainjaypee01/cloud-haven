import React from "react";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/**
 * Reusable select field for shadcn/ui forms (supports numbers, booleans, strings)
 *
 * @param {string} name - field name in react-hook-form
 * @param {object} control - react-hook-form control
 * @param {string} label - field label
 * @param {array} options - [{ value, label }]
 * @param {boolean} required
 * @param {function} [onChange] - custom handler (optional)
 * @param {string} [placeholder]
 */
const FormSelectField = ({
    name,
    control,
    label,
    options,
    required = false,
    onChange,
    placeholder,
}) => (
    <FormField
        name={name}
        control={control}
        render={({ field }) => (
            <FormItem>
                <FormLabel aria-required={required}>{label}</FormLabel>
                <FormControl>
                    <Select
                        value={
                            field.value !== undefined && field.value !== null
                                ? String(field.value)
                                : ""
                        }
                        onValueChange={(val) => {
                            if (onChange) onChange(val);
                            field.onChange(
                                options && typeof options[0]?.value === "number"
                                    ? Number(val)
                                    : options && typeof options[0]?.value === "boolean"
                                        ? val === "true"
                                        : val
                            );
                        }}
                    >
                        <SelectTrigger aria-required={required}>
                            <SelectValue placeholder={placeholder || label} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((opt, index) => {
                                // Ensure we have valid values and labels
                                const value = opt.value !== undefined && opt.value !== null ? String(opt.value) : '';
                                const label = opt.label || `Option ${index + 1}`;
                                const key = value || `option-${index}`;
                                
                                return (
                                    <SelectItem key={key} value={value}>
                                        {label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

export default FormSelectField;
