import React from 'react';
import { formatCurrency } from '@/utils/currency';

const PromoBreakdown = ({ promoInfo }) => {
    if (!promoInfo || !promoInfo.per_night_calculation || !promoInfo.perNightBreakdown) {
        return null;
    }

    const { perNightBreakdown } = promoInfo;
    const eligibleNights = perNightBreakdown.filter(night => night.eligible);
    const totalNights = perNightBreakdown.length;

    return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Promo Breakdown</h4>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Total Nights:</span>
                    <span>{totalNights}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Eligible Nights:</span>
                    <span className="text-green-600 font-medium">{eligibleNights.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Excluded Nights:</span>
                    <span className="text-gray-500">{totalNights - eligibleNights.length}</span>
                </div>
            </div>
            
            <div className="mt-3">
                <h5 className="font-medium text-blue-800 mb-2">Night-by-Night Details:</h5>
                <div className="space-y-1">
                    {perNightBreakdown.map((night, index) => (
                        <div 
                            key={index}
                            className={`flex justify-between items-center text-xs p-2 rounded ${
                                night.eligible 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{night.dayName}</span>
                                <span className="text-gray-500">({night.date})</span>
                                {night.eligible ? (
                                    <span className="text-green-600">✓</span>
                                ) : (
                                    <span className="text-gray-400">✗</span>
                                )}
                            </div>
                            <div className="text-right">
                                {night.eligible ? (
                                    <span className="text-green-700">
                                        -{formatCurrency(night.discountAmount)}
                                    </span>
                                ) : (
                                    <span className="text-gray-500">No discount</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {promoInfo.excluded_day_names && promoInfo.excluded_day_names.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> This promo excludes {promoInfo.excluded_day_names.join(', ')}.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PromoBreakdown;
