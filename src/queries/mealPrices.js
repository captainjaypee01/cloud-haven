import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import * as mealPriceService from "@/services/mealPrices"

export const useMealPrices = () => {
    const api = useApi();

    return useQuery({
        queryKey: ["meal-prices"],
        queryFn: () => mealPriceService.getMealPrice(api),
        staleTime: 10 * 60_000, // 10 minutes cache validity
        retry: (count, error) => error.status !== 404 && count < 2,
        onError: (error) => {
            console.error("Error fetching meal prices:", error.message);
        },
    });
};