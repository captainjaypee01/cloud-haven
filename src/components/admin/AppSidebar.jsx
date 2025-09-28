
import {
    ChartBarIcon,
    LayoutDashboardIcon,
    SearchIcon,
    SettingsIcon,
    UsersIcon,
    HelpCircleIcon,
    BedDouble,
    Book,
    Salad,
    Image,
    TicketIcon,
    Calendar,
    DollarSign,
    CreditCard,
    Star
} from "lucide-react";
import NavMain from "@/components/admin/NavMain"
import NavSecondary from "@/components/admin/NavSecondary"
import NavUser from "@/components/admin/NavUser"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import NavManagement from "./NavManagement";

import { NETANIA_LOGO } from "@/constants/AppConstant";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

// Define navigation items based on roles
const getNavigationData = (userRole) => {
    const allNavMain = [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon, roles: ['staff', 'admin', 'superadmin'] },
        { title: "Rooms", url: "/admin/rooms", icon: BedDouble, roles: ['admin', 'superadmin'] },
        { title: "Bookings", url: "/admin/bookings", icon: Book, roles: ['staff', 'admin', 'superadmin'] },
        { title: "Calendar", url: "/admin/bookings/calendar", icon: Calendar, roles: ['staff', 'admin', 'superadmin'] },
        { title: "Payments", url: "/admin/payments", icon: CreditCard, roles: ['admin', 'superadmin'] },
        { title: "Amenities", url: "/admin/amenities", icon: Salad, roles: ['admin', 'superadmin'] },
        { title: "Meal Programs", url: "/admin/meal-programs", icon: Calendar, roles: ['admin', 'superadmin'] },
        { title: "Promos", url: "/admin/promos", icon: TicketIcon, roles: ['admin', 'superadmin'] },
        { title: "Reviews", url: "/admin/reviews", icon: Star, roles: ['admin', 'superadmin'] },
    ];

    const allNavManagement = [
        { title: "Users", url: "/admin/users", icon: UsersIcon, roles: ['superadmin'] },
        { title: "Reports", url: "/admin/reports", icon: ChartBarIcon, roles: ['superadmin'] },
        { title: "Images", url: "/admin/images", icon: Image, roles: ['superadmin'] },
        { title: "Day Tour Pricing", url: "/admin/day-tour-pricing", icon: DollarSign, roles: ['superadmin'] },
    ];

    const navSecondary = [
        {
            title: "Settings",
            url: "#",
            icon: SettingsIcon,
        },
        {
            title: "Get Help",
            url: "#",
            icon: HelpCircleIcon,
        },
        {
            title: "Search",
            url: "#",
            icon: SearchIcon,
        },
    ];

    // Filter navigation items based on user role
    const navMain = allNavMain.filter(item => item.roles.includes(userRole));
    const navManagement = allNavManagement.filter(item => item.roles.includes(userRole));

    return {
        navMain,
        navManagement,
        navSecondary
    };
};

export default function AppSidebar({ ...props }) {
    const { user } = useUser();
    const userRole = user?.publicMetadata?.role || 'user';
    const data = getNavigationData(userRole);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link to="/" onClick={() => { window.scrollTo(0, 0); }}>
                                <img src={NETANIA_LOGO} alt="Logo" className="h-6 w-6" />
                            </Link>
                            <Link to="/" onClick={() => { window.scrollTo(0, 0); }}>
                                <span className="font-bold text-lg tracking-tight">Netania De Laiya</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {data.navManagement.length > 0 && <NavManagement items={data.navManagement} />}
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
