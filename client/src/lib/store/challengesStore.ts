import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  category: {
    id: string;
    name: string;
  };
  languages: string[];
  likes: number;
  submissions: number;
  successRate: number;
  createdAt: string;
}

interface ChallengesState {
  challenges: Challenge[];
  categories: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  
  // Fetch actions
  fetchChallenges: (
    page?: number, 
    limit?: number, 
    search?: string, 
    difficulty?: string, 
    category?: string, 
    sortBy?: string
  ) => Promise<void>;
}

// Time threshold for refetching (10 minutes in milliseconds)
const REFETCH_THRESHOLD = 10 * 60 * 1000;

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set, get) => ({
      challenges: [],
      categories: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
      lastFetched: 0,

      fetchChallenges: async (
        page = 1, 
        limit = 10, 
        search = '', 
        difficulty = undefined, 
        category = undefined, 
        sortBy = 'newest'
      ) => {
        const currentTime = Date.now();
        const state = get();
        
        // Only refetch if data is stale or parameters have changed
        if (
          state.challenges.length === 0 ||
          currentTime - state.lastFetched > REFETCH_THRESHOLD ||
          page !== state.pagination.page ||
          limit !== state.pagination.limit ||
          search !== '' ||
          difficulty !== undefined ||
          category !== undefined ||
          sortBy !== 'newest'
        ) {
          try {
            set({ isLoading: true });
            
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            if (search) params.append('search', search);
            if (difficulty) params.append('difficulty', difficulty);
            if (category) params.append('category', category);
            if (sortBy) params.append('sortBy', sortBy);
            
            // Make API request
            const response = await fetch(`/api/challenges?${params.toString()}`);
            
            if (!response.ok) {
              throw new Error('Failed to fetch challenges');
            }
            
            const data = await response.json();
            
            set({
              challenges: data.challenges || [],
              categories: data.categories || [],
              pagination: data.pagination || {
                total: 0,
                page,
                limit,
                totalPages: 0,
              },
              isLoading: false,
              error: null,
              lastFetched: currentTime,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'An unknown error occurred',
            });
          }
        }
      },
    }),
    {
      name: 'challenges-storage',
      partialize: (state) => ({
        challenges: state.challenges,
        categories: state.categories,
        pagination: state.pagination,
        lastFetched: state.lastFetched,
      }),
    }
  )
); 