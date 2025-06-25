// src/hooks/useSyncCartForm.js
import { useEffect } from "react";
import { buildCartFormValues } from "../../utils/cartFormUtils";

export function useSyncCartForm(items, reset) {
    useEffect(() => {
        reset(buildCartFormValues(items));
    }, [items, reset]);
}
