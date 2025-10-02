import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        set({ theme })
        // Apply theme to document
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark')
          document.documentElement.classList.toggle('light', theme === 'light')
        }
      },
      toggleTheme: () => {
        const { theme, setTheme } = get()
        setTheme(theme === 'light' ? 'dark' : 'light')
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // Apply theme to document on hydration
        if (state?.theme && typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', state.theme === 'dark')
          document.documentElement.classList.toggle('light', state.theme === 'light')
        }
      },
    }
  )
)