import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Language {
  id: string;
  name: string;
}

interface LanguagesState {
  languages: Language[]
  loading: boolean
  error: string | null
  lastFetched: number
  setLanguages: (languages: Language[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchLanguages: () => Promise<void>
  refetch: () => Promise<void>
}

// Time threshold for refetching (30 minutes in milliseconds)
const REFETCH_THRESHOLD = 30 * 60 * 1000

export const useLanguagesStore = create<LanguagesState>()(
  persist(
    (set, get) => ({
      languages: [],
      loading: false,
      error: null,
      lastFetched: 0,
      setLanguages: (languages: Language[]) => set({ languages }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),

      fetchLanguages: async () => {
        const { lastFetched, languages } = get()
        const currentTime = Date.now()
        const token = localStorage.getItem('auth-token');
        
        // Only refetch if data is stale or empty
        if (languages.length === 0 || currentTime - lastFetched > REFETCH_THRESHOLD) {
          try {
            set({ loading: true, error: null })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/languages`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (!response.ok) {
              throw new Error('Failed to fetch languages')
            }

            const data = await response.json()
            
            if (data.success && data.languages) {
              set({ 
                languages: data.languages,
                lastFetched: currentTime 
              })
            } else {
              throw new Error('Invalid response format')
            }
          } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to load languages' })
          } finally {
            set({ loading: false })
          }
        }
      },

      refetch: async () => {
        // Force refetch by resetting lastFetched
        set({ lastFetched: 0 })
        await get().fetchLanguages()
      },
    }),
    {
      name: 'languages-storage',
      partialize: (state) => ({ 
        languages: state.languages,
        lastFetched: state.lastFetched 
      }),
    }
  )
)