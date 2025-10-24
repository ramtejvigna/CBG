import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSessionToken } from '../auth'

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  image?: string;
  role: string;
  createdAt: string;
  userProfile: {
    bio: string;
    phone?: string;
    solved: number;
    preferredLanguage: string;
    level: number;
    points: number;
    streakDays: number;
    rank?: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      icon: string;
    }>;
    languages: Array<{
      id: string;
      name: string;
      percentage: number;
    }>;
  };
  stats?: {
    totalSubmissions: number;
    acceptedSubmissions: number;
    contestParticipations: number;
    successRate: number;
  };
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  image?: string | null;
  profile?: {
    phone?: string;
    bio?: string;
    preferredLanguage?: string;
  };
}

interface ProfileState {
  userData: UserProfile | null;
  loading: boolean;
  error: string | null;
  lastFetchedId: string | null;
  setUserData: (userData: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserProfileById: (userId: string) => Promise<void>;
  fetchUserProfileByUsername: (username: string) => Promise<void>;
  updateUserProfile: (userId: string, data: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfile: () => void;
}

const getAuthHeaders = () => {
  // Use session token from sessionStorage
  const token = getSessionToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Add initialization error handling
      userData: null,
      loading: false,
      error: null,
      lastFetchedId: null,
      setUserData: (userData: UserProfile | null) => set({ userData }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),

      fetchUserProfileById: async (userId: string) => {
        try {
          set({ loading: true, error: null, lastFetchedId: userId });

          // Use the correct endpoint for user details
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${userId}`,
            {
              headers: getAuthHeaders(),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
          }

          const data = await response.json();
          set({ userData: data });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : 'An error occurred while fetching user profile',
            userData: null 
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchUserProfileByUsername: async (username: string) => {
        try {
          set({ loading: true, error: null });

          // Use the correct endpoint for user profile by username
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/profile/${username}`,
            {
              headers: getAuthHeaders(),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
          }

          const data = await response.json();
          set({ userData: data, lastFetchedId: data.id });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : 'An error occurred while fetching user profile',
            userData: null 
          });
        } finally {
          set({ loading: false });
        }
      },

      updateUserProfile: async (userId: string, updateData: UpdateProfileData) => {
        try {
          set({ loading: true, error: null });

          // Use the correct endpoint for updating user profile
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userId}/profile`,
            {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(updateData),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            
            // Handle specific error types
            if (response.status === 413 || errorData.error === 'PAYLOAD_TOO_LARGE') {
              throw new Error('Image file is too large. Please use an image smaller than 5MB.');
            }
            
            throw new Error(errorData.message || `Failed to update profile: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.success) {
            set({ userData: data.user });
            return data.user;
          } else {
            throw new Error(data.message || 'Failed to update profile');
          }
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'An error occurred while updating profile' });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      refreshProfile: async () => {
        const { lastFetchedId, fetchUserProfileById } = get();
        if (lastFetchedId) {
          await fetchUserProfileById(lastFetchedId);
        }
      },

      clearProfile: () => {
        set({ 
          userData: null, 
          error: null, 
          lastFetchedId: null 
        });
      },
    }),
    {
      name: 'profile-storage',
      partialize: (state) => ({ 
        userData: state.userData,
        lastFetchedId: state.lastFetchedId 
      }),
      version: 1, // Add version number for state versioning
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to version 1
          // Safe type checking and migration
          const typedState = persistedState as { userData?: UserProfile | null, lastFetchedId?: string | null };
          return {
            userData: typedState?.userData || null,
            lastFetchedId: typedState?.lastFetchedId || null
          };
        }
        return persistedState as { userData: UserProfile | null, lastFetchedId: string | null };
      }
    }
  )
)