// src/components/admin/AppSidebar.jsx
import React from "react";
import {
    Home, BedDouble, Book, Salad, Users,
    BarChart2, Image, Sun, Moon, LifeBuoy, Send
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarSeparator,
    SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import { UserButton, useUser } from "@clerk/clerk-react";

const mainMenu = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Rooms", url: "/admin/rooms", icon: BedDouble },
    { title: "Bookings", url: "/admin/bookings", icon: Book },
    { title: "Amenities", url: "/admin/amenities", icon: Salad },
];
const managementMenu = [
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Reports", url: "/admin/reports", icon: BarChart2 },
    { title: "Images", url: "/admin/images", icon: Image },
    { title: "Meal Prices", url: "/admin/meal-prices", icon: Salad },
];

export default function AppSidebar2() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { collapsed, toggleCollapsed } = useSidebar();
    const { user } = useUser();

    return (
        <Sidebar
            collapsed={collapsed}
            className={`h-full border-r bg-background transition-all duration-200 ${collapsed ? "w-16" : "w-64"}`}
        >
            <SidebarHeader>
                <div className="flex items-center gap-2 px-3 py-2">
                    <img src="/src/assets/netania-logo.jpg" alt="Logo" className="h-8 w-8" />
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-tight">Admin</span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapsed}
                        className="ml-auto cursor-pointer"
                        aria-label="Collapse sidebar"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="h-5 w-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                        </svg>
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="flex-1 flex flex-col gap-0 px-0 py-0 overflow-visible">
                <SidebarGroup>
                    {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainMenu.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                    >
                                        <NavLink to={item.url} className={({ isActive }) =>
                                            `flex items-center w-full ${collapsed ? "justify-center px-0" : "gap-2 px-4"}`
                                        }>
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    {!collapsed && <SidebarGroupLabel>Management</SidebarGroupLabel>}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {managementMenu.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                    >
                                        <NavLink to={item.url} className={({ isActive }) =>
                                            `flex items-center w-full ${collapsed ? "justify-center px-0" : "gap-2 px-4"}`
                                        }>
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Support/Feedback */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="#support" className="flex items-center gap-2 px-4 py-2 w-full">
                                        <LifeBuoy className="h-5 w-5" />
                                        {!collapsed && <span>Support</span>}
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="#feedback" className="flex items-center gap-2 px-4 py-2 w-full">
                                        <Send className="h-5 w-5" />
                                        {!collapsed && <span>Feedback</span>}
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Theme toggle at the bottom, before footer */}
                <div className="mt-auto px-3 pb-2">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="cursor-pointer w-full"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5 mx-auto" />
                        ) : (
                            <Moon className="h-5 w-5 mx-auto" />
                        )}
                    </Button>
                </div>
            </SidebarContent>

            {/* Footer: User info only */}
            <SidebarFooter className={`border-t px-3 py-4`}>
                <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                    <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
                    {!collapsed && user && (
                        <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-sm">{user.fullName}</span>
                            <span className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                    )}
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
