import React from 'react'
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroupLabel,
    useSidebar
} from "@/components/ui/sidebar"
import { NavLink } from 'react-router-dom'

const NavMain = ({ items }) => {
    const { setOpenMobile, isMobile } = useSidebar()

    const handleNavigation = () => {
        // Close sidebar on mobile when navigation occurs
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton tooltip={item.title} asChild>
                                <NavLink to={item.url} onClick={handleNavigation}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

export default NavMain;