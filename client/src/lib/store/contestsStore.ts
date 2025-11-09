import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSessionToken, createAuthHeaders } from '@/lib/auth';

export interface Contest {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  registrationEnd: string;
  status: "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING" | "FINISHED";
  points: number;
  maxParticipants: number | null;
  tags: string[];
  _count: {
    participants: number;
  };
  participants?: Array<{
    user: {
      username: string;
      name: string;
      image: string | null;
    };
  }>;
  challenges?: Array<{
    challenge: {
      title: string;
      difficulty: string;
      description: string;
    };
  }>;
  isRegistered?: boolean;
}

interface ContestsState {
  contests: Contest[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  registering: string | null;
  registrationSuccess: string | null;
  
  // Actions
  setContests: (contests: Contest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRegistering: (contestId: string | null) => void;
  setRegistrationSuccess: (contestId: string | null) => void;
  
  // Fetch actions
  fetchContests: (forceRefresh?: boolean) => Promise<void>;
  registerForContest: (contestId: string) => Promise<boolean>;
  updateContestRegistration: (contestId: string, isRegistered: boolean) => void;
  
  // Utility actions
  getContestsByStatus: (status: 'upcoming' | 'live' | 'past') => Contest[];
  searchContests: (query: string, status?: 'upcoming' | 'live' | 'past') => Contest[];
}

// Time threshold for refetching (5 minutes in milliseconds)
const REFETCH_THRESHOLD = 5 * 60 * 1000;

export const useContestsStore = create<ContestsState>()(
  persist(
    (set, get) => ({
      contests: [],
      isLoading: false,
      error: null,
      lastFetched: 0,
      registering: null,
      registrationSuccess: null,

      setContests: (contests: Contest[]) => set({ contests }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setRegistering: (contestId: string | null) => set({ registering: contestId }),
      setRegistrationSuccess: (contestId: string | null) => set({ registrationSuccess: contestId }),

      fetchContests: async (forceRefresh = false) => {
        const currentTime = Date.now();
        const state = get();
        
        // Check if we should refetch based on cache or force refresh
        const shouldRefetch = 
          forceRefresh ||
          state.contests.length === 0 ||
          currentTime - state.lastFetched > REFETCH_THRESHOLD;

        if (!shouldRefetch && state.contests.length > 0) {
          // Return cached data without loading state
          return;
        }

        // If we have cached data, don't show loading initially (background refresh)
        const showLoading = state.contests.length === 0;
        
        if (showLoading) {
          set({ isLoading: true });
        }
        
        set({ error: null });

        try {
          // Get session token for authenticated requests
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...createAuthHeaders()
          };
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests`, {
            headers
          });

          if (!response.ok) {
            throw new Error("Failed to fetch contests");
          }

          const data = await response.json();
          
          set({
            contests: data,
            isLoading: false,
            lastFetched: currentTime,
            error: null,
          });
        } catch (error) {
          console.error("Error fetching contests:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "An error occurred",
          });
        }
      },

      registerForContest: async (contestId: string) => {
        try {
          set({ registering: contestId, error: null, registrationSuccess: null });

          const token = getSessionToken();
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${contestId}/register`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // Update the contest registration status in local state
          get().updateContestRegistration(contestId, true);

          set({ registrationSuccess: contestId });
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ registrationSuccess: null });
          }, 3000);

          return true;
        } catch (error) {
          console.error('Registration error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            registrationSuccess: null
          });
          return false;
        } finally {
          set({ registering: null });
        }
      },

      updateContestRegistration: (contestId: string, isRegistered: boolean) => {
        const state = get();
        const updatedContests = state.contests.map(contest => 
          contest.id === contestId 
            ? { 
                ...contest, 
                isRegistered,
                _count: { 
                  participants: contest._count.participants + (isRegistered ? 1 : -1) 
                }
              }
            : contest
        );
        set({ contests: updatedContests });
      },

      getContestsByStatus: (status: 'upcoming' | 'live' | 'past') => {
        const { contests } = get();
        return contests.filter((contest) => {
          switch (status) {
            case 'upcoming':
              return ["UPCOMING", "REGISTRATION_OPEN"].includes(contest.status);
            case 'live':
              return contest.status === "ONGOING";
            case 'past':
              return contest.status === "FINISHED";
            default:
              return true;
          }
        });
      },

      searchContests: (query: string, status?: 'upcoming' | 'live' | 'past') => {
        const state = get();
        let contestsToSearch = status ? state.getContestsByStatus(status) : state.contests;
        
        if (!query.trim()) {
          return contestsToSearch;
        }

        const lowercaseQuery = query.toLowerCase();
        return contestsToSearch.filter((contest) => 
          contest.title.toLowerCase().includes(lowercaseQuery) ||
          contest.description.toLowerCase().includes(lowercaseQuery) ||
          contest.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      },
    }),
    {
      name: 'contests-storage',
      partialize: (state) => ({
        contests: state.contests,
        lastFetched: state.lastFetched,
        // Don't persist loading states, errors, or registration states
      }),
    }
  )
);