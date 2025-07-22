
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
    Image
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

const data = {
    navMain: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon },
        { title: "Rooms", url: "/admin/rooms", icon: BedDouble },
        { title: "Bookings", url: "/admin/bookings", icon: Book },
        { title: "Amenities", url: "/admin/amenities", icon: Salad },
    ],
    navManagement: [
        { title: "Users", url: "/admin/users", icon: UsersIcon },
        { title: "Reports", url: "/admin/reports", icon: ChartBarIcon },
        { title: "Images", url: "/admin/images", icon: Image },
        { title: "Meal Prices", url: "/admin/meal-prices", icon: Salad },
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
                            <img src="/src/assets/netania-logo.jpg" alt="Logo" className="h-6 w-6" />
                            <span className="font-bold text-lg tracking-tight">Netania De Laiya</span>
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
