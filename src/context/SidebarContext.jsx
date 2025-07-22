// src/context/SidebarContext
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => useContext(SidebarContext);