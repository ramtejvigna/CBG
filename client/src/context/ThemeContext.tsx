"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext<{theme: string; setTheme: (theme: string) => void}>({
    theme: 'dark',
    setTheme: () => {}
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState('dark');

    // Initialize theme from localStorage if available
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            document.documentElement.classList.toggle('light', savedTheme === 'light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        // Save to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
            document.documentElement.classList.toggle('light', newTheme === 'light');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext);