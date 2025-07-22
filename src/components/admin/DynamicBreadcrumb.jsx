// src/components/admin/DynamicBreadcrumb.jsx
import { useLocation } from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Sidebar groupings (reuse your actual nav data, or define here)
const NAV = [
    {
        label: 'Menu', items: [
            { title: 'Dashboard', url: '/admin' },
            { title: 'Rooms', url: '/admin/rooms' },
            { title: 'Bookings', url: '/admin/bookings' },
            { title: 'Amenities', url: '/admin/amenities' },
        ]
    },
    {
        label: 'Management', items: [
            { title: 'Users', url: '/admin/users' },
            { title: 'Reports', url: '/admin/reports' },
            { title: 'Images', url: '/admin/images' },
            { title: 'Meal Prices', url: '/admin/meal-prices' },
        ]
    },
];

export default function DynamicBreadcrumb() {
    const { pathname } = useLocation();

    let groupLabel = '';
    let pageLabel = '';

    for (const group of NAV) {
        const found = group.items.find(i => i.url === pathname);
        if (found) {
            groupLabel = group.label;
            pageLabel = found.title;
            break;
        }
    }

    // Fallback for subroutes or unknowns
    if (!groupLabel) {
        groupLabel = 'Menu';
        pageLabel = pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard';
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">{groupLabel}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
