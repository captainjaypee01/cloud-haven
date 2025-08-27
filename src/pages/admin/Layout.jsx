// src/pages/admin/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/admin/AppSidebar";
import SEO from "@/components/SEO";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import DynamicBreadcrumb from "@/components/admin/DynamicBreadcrumb";

export default function Layout() {
    return (
        <SidebarProvider>
            {/* Prevent indexing of admin routes */}
            <SEO title="Admin" noindex={true} />
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
    );
}
