
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
    CreditCard
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
const data = {
    navMain: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon },
        { title: "Rooms", url: "/admin/rooms", icon: BedDouble },
        { title: "Bookings", url: "/admin/bookings", icon: Book },
        { title: "Calendar", url: "/admin/bookings/calendar", icon: LayoutDashboardIcon },
        { title: "Payments", url: "/admin/payments", icon: CreditCard },
        { title: "Amenities", url: "/admin/amenities", icon: Salad },
        { title: "Meal Programs", url: "/admin/meal-programs", icon: Calendar },
        { title: "Promos", url: "/admin/promos", icon: TicketIcon },
    ],
    navManagement: [
        { title: "Users", url: "/admin/users", icon: UsersIcon },
        { title: "Reports", url: "/admin/reports", icon: ChartBarIcon },
        { title: "Images", url: "/admin/images", icon: Image },
        { title: "Day Tour Pricing", url: "/admin/day-tour-pricing", icon: DollarSign },
    ],
    navSecondary: [
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
    ],
}

export default function AppSidebar({ ...props }) {
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
                <NavManagement items={data.navManagement} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
