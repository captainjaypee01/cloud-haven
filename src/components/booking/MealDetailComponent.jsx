import React from "react";
import { formatCurrency } from "../../utils/currency";
import { Calendar } from "lucide-react";

/**
 * Reusable component for displaying Day Tour meal details
 * Shows per-room meal breakdown with pricing calculations
 */
const MealDetailComponent = ({ 
    mealQuoteData, 
    title = "Day Tour Meal Details",
    showTitle = true,
    className = ""
}) => {
    // Handle both string and object formats
    const mealData = typeof mealQuoteData === 'string' 
        ? JSON.parse(mealQuoteData) 
        : mealQuoteData;
    
    // Don't render if no meal data or selections
    if (!mealData?.selections) {
        return null;
    }

    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
            {showTitle && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-100 rounded-full">
                        <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                </div>
            )}
            
            <div className="space-y-4">
                {mealData.selections.map((selection, idx) => (
                    <div key={idx} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                        <div className="font-medium mb-3 text-amber-900">
                            {selection.room_name} - {selection.adults + selection.children} guests
                        </div>
                        
                        {/* Buffet Lunch */}
                        <div className="text-sm mb-2">
                            {selection.include_lunch ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>Buffet Lunch: </span>
                                    <span className="text-gray-700">
                                        {selection.adults > 0 && selection.children > 0 ? (
                                            `${selection.adults} adults × ${formatCurrency(selection.lunch_adult_price || 0)} + ${selection.children} children × ${formatCurrency(selection.lunch_child_price || 0)} = ${formatCurrency(selection.lunch_cost)}`
                                        ) : selection.adults > 0 ? (
                                            `${selection.adults} adults × ${formatCurrency(selection.lunch_adult_price || 0)} = ${formatCurrency(selection.lunch_cost)}`
                                        ) : (
                                            `${selection.children} children × ${formatCurrency(selection.lunch_child_price || 0)} = ${formatCurrency(selection.lunch_cost)}`
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span>Buffet Lunch: Not included</span>
                                </div>
                            )}
                        </div>
                        
                        {/* PM Snack */}
                        <div className="text-sm mb-2">
                            {selection.include_pm_snack ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>PM Snack (Optional): </span>
                                    <span className="text-gray-700">
                                        {selection.adults > 0 && selection.children > 0 ? (
                                            `${selection.adults} adults × ${formatCurrency(selection.pm_snack_adult_price || 0)} + ${selection.children} children × ${formatCurrency(selection.pm_snack_child_price || 0)} = ${formatCurrency(selection.pm_snack_cost)}`
                                        ) : selection.adults > 0 ? (
                                            `${selection.adults} adults × ${formatCurrency(selection.pm_snack_adult_price || 0)} = ${formatCurrency(selection.pm_snack_cost)}`
                                        ) : (
                                            `${selection.children} children × ${formatCurrency(selection.pm_snack_child_price || 0)} = ${formatCurrency(selection.pm_snack_cost)}`
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    <span>PM Snack: Not included</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Dinner (for future use) */}
                        {selection.include_dinner && (
                            <div className="text-sm mb-2">
                                <div className="flex items-center gap-2 text-green-600">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>Dinner: </span>
                                    <span className="text-gray-700">
                                        {formatCurrency(selection.dinner_cost || 0)}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {selection.meal_cost > 0 && (
                            <div className="text-sm font-medium mt-3 pt-3 border-t border-amber-300 text-amber-900">
                                Room Meal Total: {formatCurrency(selection.meal_cost)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MealDetailComponent;
