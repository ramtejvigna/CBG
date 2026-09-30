"use client";

import { useThemeStore } from "@/lib/store/themeStore";

// Kept for existing imports; the persisted theme store is the single source of truth.
export const useTheme = () => {
    const { theme, toggleTheme } = useThemeStore();
    return { theme, setTheme: toggleTheme };
};
