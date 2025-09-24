import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { Baby, User, Users } from "lucide-react";

/**
 * Child Policy Dialog Component
 * 
 * Displays the resort's child policy including age categories and pricing
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Function to handle dialog open/close
 * 
 * @returns {JSX.Element} The child policy dialog component
 */
export const ChildPolicyDialog = ({ open, onOpenChange }) => {
    const childPolicies = [
        {
            icon: <Baby className="w-8 h-8 text-green-600" />,
            ageRange: "3 years old and below",
            pricing: "Free of charge",
            description: "Children aged 3 and below are free of charge for the entrance fee.",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            badge: "FREE",
            badgeVariant: "success"
        },
        {
            icon: <User className="w-8 h-8 text-orange-600" />,
            ageRange: "4 to 6 years old",
            pricing: "Child buffet rate",
            description: "Children aged 4 to 6 years old will be charged a reduced buffet rate. Please check current pricing during booking.",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-800",
            badge: "CHILD RATE",
            badgeVariant: "warning"
        },
        {
            icon: <Users className="w-8 h-8 text-blue-600" />,
            ageRange: "7 years old and above",
            pricing: "Same rate as adult",
            description: "Children aged 7 years and above will be charged the same rate as adults.",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            badge: "ADULT RATE",
            badgeVariant: "default"
        }
    ];

    const additionalPolicies = [
        "They are allowed to share a bed with accompanying adults at no additional cost.",
        "3 years old and below are not required to avail of the buffet but may share food from the adults' plates.",
        "Final number of children and headcount must be confirmed one week before the booking schedule.",
        "The resort reserves the right to verify age with valid identification if needed."
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center flex items-center gap-2 justify-center">
                        <Baby className="w-6 h-6 text-blue-600" />
                        Child Policy
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Understanding our child age categories and pricing
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Age Categories */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Categories & Pricing</h3>
                        
                        {childPolicies.map((policy, index) => (
                            <Card key={index} className={`${policy.bgColor} ${policy.borderColor} border-2`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            {policy.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className={`font-semibold text-lg ${policy.textColor}`}>
                                                    {policy.ageRange}
                                                </h4>
                                                <Badge variant={policy.badgeVariant} className="text-xs">
                                                    {policy.badge}
                                                </Badge>
                                            </div>
                                            <p className={`font-medium text-base mb-2 ${policy.textColor}`}>
                                                {policy.pricing}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {policy.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Additional Policies */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Child Policies</h3>
                        <ul className="space-y-2">
                            {additionalPolicies.map((policy, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{policy}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5">
                                ⚠️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-800 mb-1">Important Notice:</p>
                                <p className="text-sm text-amber-700">
                                    Please ensure accurate age information when booking as rates are determined by age categories. 
                                    Age verification may be required upon check-in.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-4 gap-3">
                        <Button 
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2 cursor-pointer"
                        >
                            Close
                        </Button>
                        <Button 
                            onClick={() => onOpenChange(false)}
                            className="px-8 py-2 cursor-pointer"
                        >
                            I Understand
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChildPolicyDialog;
