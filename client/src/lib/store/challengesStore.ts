import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  points: number;
  timeLimit: number;
  memoryLimit: number;
  challengeType?: 'ALGORITHM' | 'DATA_STRUCTURE' | 'SYSTEM_DESIGN' | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    image?: string;
  };
  category: {
    id: string;
    name: string;
    description?: string;
  };
  languages: Array<{
    id: string;
    name: string;
  }>;
  testCases: Array<{
    id: string;
    input: string;
    output: string;
    isHidden: boolean;
    explanation?: string;
  }>;
  likes: number;
  dislikes: number;
  submissions: number;
  submissionStats: {
    avgRuntime: number;
    avgMemory: number;
  };
  _count?: {
    submissions: number;
    likes: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

interface SingleChallengeState {
  currentChallenge: Challenge | null;
  challengeLoading: boolean;
  challengeError: string | null;
}

interface ChallengesState extends SingleChallengeState {
  challenges: Challenge[];
  categories: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  
  // Actions
  setCurrentChallenge: (challenge: Challenge | null) => void;
  setChallengeLoading: (loading: boolean) => void;
  setChallengeError: (error: string | null) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Fetch actions
  fetchChallenges: (options?: {
    category?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchChallenge: (slug: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  refetchChallenges: () => Promise<void>;
  refetchChallenge: () => Promise<void>;
}

// Time threshold for refetching (10 minutes in milliseconds)
const REFETCH_THRESHOLD = 10 * 60 * 1000;

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set, get) => ({
      // Single challenge state
      currentChallenge: null,
      challengeLoading: false,
      challengeError: null,
      
      // Challenges list state
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

      // Single challenge actions
      setCurrentChallenge: (challenge: Challenge | null) => set({ currentChallenge: challenge }),
      setChallengeLoading: (loading: boolean) => set({ challengeLoading: loading }),
      setChallengeError: (error: string | null) => set({ challengeError: error }),
      
      // Challenges list actions
      setChallenges: (challenges: Challenge[]) => set({ challenges }),
      setCategories: (categories: Category[]) => set({ categories }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      fetchChallenge: async (slug: string) => {
        set({ challengeLoading: true, challengeError: null });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/challenges/slug/${encodeURIComponent(slug)}`);
          if (response.ok) {
            const apiChallenge = await response.json();
            const mappedChallenge: Challenge = {
              ...apiChallenge,
              slug: slug,
              dislikes: apiChallenge.dislikes || 0,
              submissions: apiChallenge._count?.submissions || 0,
              likes: apiChallenge._count?.likes || 0,
              submissionStats: {
                avgRuntime: 68,
                avgMemory: 38.9
              }
            };
            set({ currentChallenge: mappedChallenge });
          } else {
            throw new Error('Challenge not found');
          }
        } catch (apiError) {
          console.warn('Failed to fetch challenge from API:', apiError);
          set({ challengeError: 'Failed to load challenge. Please try again.' });
        } finally {
          set({ challengeLoading: false });
        }
      },

      fetchChallenges: async (options = {}) => {
        const { category, difficulty, page = 1, limit = 10 } = options;
        const currentTime = Date.now();
        const state = get();
        
        // Only refetch if data is stale or parameters have changed
        if (
          state.challenges.length === 0 ||
          currentTime - state.lastFetched > REFETCH_THRESHOLD ||
          page !== state.pagination.page ||
          limit !== state.pagination.limit ||
          category !== undefined ||
          difficulty !== undefined
        ) {
          try {
            set({ isLoading: true, error: null });
            
            // Build query parameters
            const params = new URLSearchParams();
            if (category && category !== 'all') {
              params.append('category', category);
            }
            if (difficulty && difficulty !== 'all') {
              params.append('difficulty', difficulty);
            }
            if (page) {
              params.append('page', page.toString());
            }
            if (limit) {
              params.append('limit', limit.toString());
            }

            const queryString = params.toString();
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/challenges${queryString ? '?' + queryString : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch challenges: ${response.statusText}`);
            }

            const data = await response.json();
            set({
              challenges: data,
              pagination: {
                total: data.length,
                page,
                limit,
                totalPages: Math.ceil(data.length / limit),
              },
              isLoading: false,
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

      fetchCategories: async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`);
          if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.statusText}`);
          }

          const data = await response.json();
          set({ categories: data });
        } catch (err) {
          console.error('Error fetching categories:', err);
          // Don't set error for categories as they're not critical
        }
      },

      refetchChallenges: async () => {
        // Force refetch by resetting lastFetched
        set({ lastFetched: 0 });
        await get().fetchChallenges();
      },

      refetchChallenge: async () => {
        const { currentChallenge } = get();
        if (currentChallenge?.slug) {
          await get().fetchChallenge(currentChallenge.slug);
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
        currentChallenge: state.currentChallenge,
      }),
    }
  )
); 