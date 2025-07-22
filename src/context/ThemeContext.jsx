// src/contexts/theme-context.js
import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");

    // Load initial theme from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem("theme");
        if (stored) {
            setTheme(stored);
            document.documentElement.classList.toggle("dark", stored === "dark");
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setTheme(prefersDark ? "dark" : "light");
            document.documentElement.classList.toggle("dark", prefersDark);
        }
    }, []);

    // Change html class and save
    const changeTheme = (mode) => {
        setTheme(mode);
        document.documentElement.classList.toggle("dark", mode === "dark");
        localStorage.setItem("theme", mode);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);