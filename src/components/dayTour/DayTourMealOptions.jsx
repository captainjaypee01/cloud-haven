import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { UtensilsCrossed, Coffee } from "lucide-react";

export function DayTourMealOptions({ 
    availability, 
    includeLunch, 
    onIncludeLunchChange,
    includePmSnack,
    onIncludePmSnackChange 
}) {
    if (!availability.buffet_active) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5" />
                        Meal Options
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-gray-500">
                        <p>Buffet meals are not available on the selected date.</p>
                        <p className="text-sm">Only complimentary snacks may be available.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { lunch_prices, pm_snack_prices, pm_snack_policy } = availability;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5" />
                    Meal Options
                </CardTitle>
                <div className="text-sm text-gray-600">
                    Optional add-ons for your Day Tour experience
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Buffet Lunch */}
                {lunch_prices && (
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                            id="lunch"
                            checked={includeLunch}
                            onCheckedChange={onIncludeLunchChange}
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="lunch"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Buffet Lunch
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                            A delicious buffet lunch offering a wide variety of options.
                            </p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline">
                                    Adult: {formatCurrency(lunch_prices.adult)}
                                </Badge>
                                <Badge variant="outline">
                                    Child: {formatCurrency(lunch_prices.child)}
                                </Badge>
                            </div>
                        </div>
                        <UtensilsCrossed className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                )}

                {/* PM Snack */}
                {pm_snack_prices && pm_snack_policy !== 'hidden' && (
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                            id="pmSnack"
                            checked={includePmSnack || pm_snack_policy === 'required'}
                            onCheckedChange={pm_snack_policy === 'required' ? undefined : onIncludePmSnackChange}
                            disabled={pm_snack_policy === 'required'}
                        />
                        <div className="flex-1">
                            <label
                                htmlFor="pmSnack"
                                className={`text-sm font-medium leading-none ${
                                    pm_snack_policy === 'required' 
                                        ? 'cursor-not-allowed opacity-70' 
                                        : 'cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                                }`}
                            >
                                PM Snack
                                {pm_snack_policy === 'required' && (
                                    <Badge variant="secondary" className="ml-2">Required</Badge>
                                )}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                                {pm_snack_policy === 'required' 
                                    ? 'Afternoon snack included in your Day Tour package'
                                    : 'Light afternoon snacks and refreshments'
                                }
                            </p>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline">
                                    Adult: {formatCurrency(pm_snack_prices.adult)}
                                </Badge>
                                <Badge variant="outline">
                                    Child: {formatCurrency(pm_snack_prices.child)}
                                </Badge>
                            </div>
                        </div>
                        <Coffee className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                )}

                {(!lunch_prices && (!pm_snack_prices || pm_snack_policy === 'hidden')) && (
                    <div className="text-center py-4 text-gray-500">
                        <p>No additional meal options available for the selected date.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
