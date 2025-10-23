// src/pages/admin/Layout.jsx
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/admin/AppSidebar";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import SEO from "@/components/SEO";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import DynamicBreadcrumb from "@/components/admin/DynamicBreadcrumb";

// Component to handle sidebar auto-close on route changes
function SidebarAutoClose() {
    const location = useLocation();
    const { setOpenMobile, isMobile } = useSidebar();

    useEffect(() => {
        // Close sidebar on mobile when route changes
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [location.pathname, isMobile, setOpenMobile]);

    return null;
}

export default function Layout() {
    return (
        <ProtectedAdminRoute>
            <SidebarProvider>
                {/* Prevent indexing of admin routes */}
                <SEO title="Admin" noindex={true} />
                <SidebarAutoClose />
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <DynamicBreadcrumb />
                        </div>
                    </header>
                    <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
                        <Outlet />
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedAdminRoute>
    );
}
