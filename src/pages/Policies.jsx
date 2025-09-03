// src/pages/Policies.jsx
import React, { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RESORT_POLICIES, POLICY_ICONS, HERO_IMAGE } from "@/constants/policies";

const Policies = () => {
    const [activeTab, setActiveTab] = useState('child');

    // Memoize policy data to prevent unnecessary re-renders
    const policyEntries = useMemo(() => Object.entries(RESORT_POLICIES), []);

    // Enhanced SEO data with complete policy information
    const seoData = useMemo(() => ({
        title: "Resort Policies - Child, Room & Buffet Rules",
        description: "Complete resort policies for Netania De Laiya: child pricing (₱1,000 for 4-6 years), check-in/out times (3:00 PM/1:00 PM), buffet schedules, accommodation rules, and pet policies. Book with confidence knowing our comprehensive guidelines.",
        canonical: typeof window !== 'undefined' ? window.location.origin + '/policy' : 'https://www.netaniadelaiya.com/policy',
        og: { 
            url: 'https://www.netaniadelaiya.com/policy',
            image: HERO_IMAGE,
            type: 'website'
        },
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'What is the child policy for buffet?',
                    acceptedAnswer: { 
                        '@type': 'Answer', 
                        text: 'Children aged 3 and below are free. Children 4-6 years old pay ₱1,000 for buffet. Children 7 and above pay adult rate of ₱1,700.' 
                    }
                },
                {
                    '@type': 'Question',
                    name: 'What are the check-in and check-out times?',
                    acceptedAnswer: { 
                        '@type': 'Answer', 
                        text: 'Check-in is at 3:00 PM and check-out is at 1:00 PM.' 
                    }
                },
                {
                    '@type': 'Question',
                    name: 'What are the buffet timings?',
                    acceptedAnswer: { 
                        '@type': 'Answer', 
                        text: 'Breakfast: 6:30 AM - 8:00 AM, Lunch: 11:30 AM - 1:00 PM, Dinner: 6:30 PM - 8:00 PM' 
                    }
                },
                {
                    '@type': 'Question',
                    name: 'Can I bring food to the resort?',
                    acceptedAnswer: { 
                        '@type': 'Answer', 
                        text: 'Outside food is not allowed in hotel rooms, but you can bring snacks, drinks, and fast food with no corkage fee. Lechon has a ₱2,500 corkage fee.' 
                    }
                },
                {
                    '@type': 'Question',
                    name: 'Are pets allowed?',
                    acceptedAnswer: { 
                        '@type': 'Answer', 
                        text: 'Small pets up to 10kg are allowed in designated rooms with a cleaning fee. Pets must be leashed in common areas.' 
                    }
                }
            ]
        }
    }), []);

    const renderPolicyContent = (policyData) => {
        return (
            <div className="space-y-6">
                {policyData.policies.map((category, index) => (
                    <Card key={`${policyData.title}-${index}`} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-blue-700">
                                {category.category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {category.rules.map((rule, ruleIndex) => (
                                    <li key={`${category.category}-${ruleIndex}`} className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
                                        <span className="text-gray-700">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
    };

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200">
            <SEO {...seoData} />
            
            {/* Hero Section with optimized image loading */}
            <div className="relative w-full">
                <div 
                    className="h-screen w-full bg-cover bg-center bg-no-repeat" 
                    style={{ 
                        backgroundImage: `url('${HERO_IMAGE}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                    role="img"
                    aria-label="Resort policies hero image"
                />
                {/* Hero Title Overlay */}
                <div className="absolute top-1/2 w-full text-center px-4 -translate-y-1/2">
                    <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-lg">
                        Resort Policies
                    </h1>
                </div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto py-16 px-4 md:px-8 lg:px-0 text-gray-800">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">Resort Policies</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Please review our comprehensive policies before making a reservation to ensure a smooth and enjoyable stay.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="flex justify-center mb-8">
                            <TabsList 
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-gray-100 max-w-4xl w-full gap-2"
                                role="tablist"
                                aria-label="Resort policy categories"
                            >
                                {policyEntries.map(([key, policy]) => (
                                    <TabsTrigger 
                                        key={key} 
                                        value={key}
                                        className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 text-center min-h-[80px] md:min-h-[100px] cursor-pointer"
                                        role="tab"
                                        aria-selected={activeTab === key}
                                        aria-controls={`tab-content-${key}`}
                                    >
                                        <span className="text-lg md:text-2xl" aria-hidden="true">
                                            {POLICY_ICONS[key]}
                                        </span>
                                        <span className="text-xs font-medium leading-tight px-1">
                                            {policy.title}
                                        </span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {policyEntries.map(([key, policy]) => (
                            <TabsContent 
                                key={key} 
                                value={key} 
                                className="mt-8"
                                id={`tab-content-${key}`}
                                role="tabpanel"
                                aria-labelledby={`tab-${key}`}
                            >
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h3 className="text-3xl font-bold text-gray-800 mb-2">
                                            {policy.title}
                                        </h3>
                                        <p className="text-gray-600 text-lg">
                                            {policy.description}
                                        </p>
                                    </div>
                                    
                                    {renderPolicyContent(policy)}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Policies;
