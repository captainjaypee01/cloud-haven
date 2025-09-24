import { useLocation, Link } from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Flat list of all sidebar navs
const NAV = [
    { group: 'Menu', title: 'Dashboard', url: '/admin' },
    { group: 'Menu', title: 'Rooms', url: '/admin/rooms' },
    { group: 'Menu', title: 'Bookings', url: '/admin/bookings' },
    { group: 'Menu', title: 'Amenities', url: '/admin/amenities' },
    { group: 'Menu', title: 'Reviews', url: '/admin/reviews' },
    { group: 'Management', title: 'Users', url: '/admin/users' },
    { group: 'Management', title: 'Reports', url: '/admin/reports' },
    { group: 'Management', title: 'Images', url: '/admin/images' },
    { group: 'Management', title: 'Meal Programs', url: '/admin/meal-programs' },
];

function getBreadcrumbParts(pathname) {
    // Find the deepest nav match (by longest url)
    let match = null;
    for (const nav of NAV) {
        if (
            pathname === nav.url ||
            (pathname.startsWith(nav.url + '/') && nav.url.length > (match?.url.length ?? 0))
        ) {
            match = nav;
        }
    }
    if (match) {
        // get sub path after menu (e.g. /admin/bookings/13 → '13')
        const subPath = pathname.slice(match.url.length).replace(/^\//, '');
        return {
            group: match.group,
            parent: { title: match.title, url: match.url },
            child: subPath || null,
        };
    }
    // fallback
    return {
        group: 'Menu',
        parent: { title: 'Dashboard', url: '/admin' },
        child: null,
    };
}

export default function DynamicBreadcrumb() {
    const { pathname } = useLocation();
    const { group, parent, child } = getBreadcrumbParts(pathname);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                        <span>{group}</span>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to={parent.url}>{parent.title}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {child && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{decodeURIComponent(child)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
