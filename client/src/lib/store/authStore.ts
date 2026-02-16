import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProfileStore } from './profileStore'; // Import the profile store
import { useCodeExecutionStore } from './codeExecutionStore'; // Import the code execution store
import { getSessionToken, setSessionToken, removeSessionToken, createAuthHeaders } from '../auth';

export interface User {
    id: string;
    email: string;
    username: string;
    name?: string;
    fullName?: string;
    preferredLanguage?: string;
    image?: string;
    hasImage?: boolean;
    role?: string;
    level?: number;
    points?: number;
    userProfile?: {
        id: string;
        bio?: string;
        level: number;
        points: number;
        solved: number;
        rank?: number;
        streakDays: number;
        preferredLanguage: string;
        badges: Array<{
            id: string;
            name: string;
            description: string;
            iconType: string;
            points: number;
        }>;
        languages: Array<{
            id: string;
            name: string;
            percentage: number;
        }>;
    };
}

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (userData: Partial<User> & { password: string }) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUserStats: (stats: { points?: number; level?: number }) => Promise<void>;
    clearAllStorages: () => void;
}

// Helper function to clear NextAuth-specific storage and cookies
const clearNextAuthStorage = () => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    try {
        // Clear NextAuth session tokens from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('next-auth.')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Clear NextAuth session tokens from sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith('next-auth.')) {
                sessionKeysToRemove.push(key);
            }
        }
        sessionKeysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        // Clear NextAuth cookies
        const cookiesToClear = [
            'next-auth.session-token',
            'next-auth.csrf-token',
            'next-auth.callback-url',
            '__Secure-next-auth.session-token',
            '__Host-next-auth.csrf-token'
        ];
        
        cookiesToClear.forEach(cookieName => {
            // Clear for current domain
            document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
            // Clear for current domain with secure flag
            document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure;`;
            // Clear for subdomain if applicable
            if (window.location.hostname.includes('.')) {
                document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=.${window.location.hostname.split('.').slice(-2).join('.')};`;
            }
        });
    } catch (error) {
        console.error('Error clearing NextAuth storage:', error);
    }
};

// Helper function to clear all user-specific storages
const clearUserStorages = () => {
    // Clear profile storage
    const profileStore = useProfileStore.getState();
    if (profileStore && profileStore.clearProfile) {
        profileStore.clearProfile();
    }
    
    // Clear code execution storage
    const codeExecutionStore = useCodeExecutionStore.getState();
    if (codeExecutionStore && codeExecutionStore.clearResult) {
        codeExecutionStore.clearResult();
    }
    
    // Clear localStorage for these stores manually as well to ensure complete cleanup
    try {
        localStorage.removeItem('profile-storage');
        localStorage.removeItem('code-execution-storage');
        // Note: We don't clear 'auth-storage' here as it's handled by zustand when we set user to null
        // Note: We don't clear 'languages-storage', 'contests-storage', or 'challenges-storage' as they contain 
        // general app data that can be reused across different users
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
    
    // Also clear NextAuth storage
    clearNextAuthStorage();
};

// Export the NextAuth clearing function for use in other places
export const clearNextAuthStorageAndCookies = clearNextAuthStorage;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Add initialization error handling
            user: null,
            loading: true,
            error: null,
            setUser: (user) => {
                set({ user });
            },
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            checkAuth: async () => {
                try {
                    const sessionToken = getSessionToken();
                    if (sessionToken) {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
                            headers: {
                                ...createAuthHeaders(),
                                'Content-Type': 'application/json'
                            }
                        });
                        if (response.ok) {
                            const userData = await response.json();
                            // Extract the actual user data from the response
                            const actualUser = userData.user || userData;
                            set({ user: actualUser });
                            
                            // Also update the profile store with the user data
                            const profileStore = useProfileStore.getState();
                            if (profileStore && actualUser) {
                                // Initialize profile store with user data
                                profileStore.setUserData({
                                    ...actualUser,
                                    userProfile: actualUser.userProfile || {
                                        id: '',
                                        bio: '',
                                        level: 1,
                                        points: 0,
                                        solved: 0,
                                        streakDays: 0,
                                        preferredLanguage: 'javascript',
                                        badges: [],
                                        languages: []
                                    },
                                    createdAt: actualUser.createdAt || new Date().toISOString(),
                                    role: actualUser.role || 'USER'
                                });
                                profileStore.setLoading(false);
                            }
                        } else {
                            removeSessionToken();
                            clearUserStorages();
                            set({ user: null });
                        }
                    } else {
                        // If no session token is present, clear all user-specific storages
                        clearUserStorages();
                        set({ user: null });
                    }
                } catch (err) {
                    console.error('Auth check failed:', err);
                    removeSessionToken();
                    clearUserStorages();
                    set({ user: null });
                } finally {
                    set({ loading: false });
                }
            },

            login: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Login failed');
                    }
                    
                    if (data.success && data.sessionToken) {
                        setSessionToken(data.sessionToken);
                        set({ user: data.user });
                        
                        // Also update the profile store with the user data
                        const profileStore = useProfileStore.getState();
                        if (profileStore && data.user) {
                            // We're setting the user data in the profile store
                            profileStore.setUserData({
                                ...data.user,
                                userProfile: data.user.userProfile,
                                createdAt: new Date().toISOString(),
                                role: data.user.role || 'USER'
                            });
                            profileStore.setLoading(false);
                        }
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (err) {
                    set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
                    throw err;
                } finally {
                    set({ loading: false });
                }
            },

            signup: async (userData: Partial<User> & { password: string }) => {
                set({ loading: true, error: null });
                try {
                    const signupData = {
                        email: userData.email,
                        password: userData.password,
                        username: userData.username || userData.email?.split('@')[0] || 'user',
                        fullName: userData.fullName || userData.username || 'User',
                        preferredLanguage: userData.preferredLanguage || 'javascript'
                    };
                    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(signupData),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Signup failed');
                    }

                    if (data.success && data.sessionToken) {
                        setSessionToken(data.sessionToken);
                        set({ user: data.user });
                    } else {
                        throw new Error('Invalid response from server');
                    }
                } catch (err) {
                    set({ error: err instanceof Error ? err.message : 'An unexpected error occurred' });
                    throw err;
                } finally {
                    set({ loading: false });
                }
            },

            logout: async () => {
                set({ loading: true });
                try {
                    console.log('Store logout: Starting logout process...');
                    const sessionToken = getSessionToken();
                    if (sessionToken) {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
                            method: 'POST',
                            headers: {
                                ...createAuthHeaders(),
                                'Content-Type': 'application/json'
                            }
                        });
                    }
                    removeSessionToken();
                    clearUserStorages();
                    set({ user: null });
                    
                    // Try to clear NextAuth session if signOut is available (client-side only)
                    if (typeof window !== 'undefined') {
                        try {
                            // Dynamic import to avoid SSR issues
                            const { signOut } = await import('next-auth/react');
                            console.log('Store logout: Calling NextAuth signOut...');
                            await signOut({ redirect: false });
                        } catch (nextAuthError) {
                            console.log('NextAuth signOut not available or failed:', nextAuthError);
                            // This is okay, NextAuth might not be available in all contexts
                        }
                    }
                } catch (err) {
                    console.error('Logout failed:', err);
                    // Even if logout API fails, still clear storages and session
                    removeSessionToken();
                    clearUserStorages();
                    set({ user: null });
                } finally {
                    set({ loading: false });
                }
            },

            updateUserStats: async (stats: { points?: number; level?: number }) => {
                const currentUser = get().user;
                if (!currentUser) return;

                try {
                    const response = await fetch('/api/user/stats', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(stats),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update user stats');
                    }

                    const updatedUser = {
                        ...currentUser,
                        points: stats.points !== undefined ? stats.points : currentUser.points,
                        level: stats.level !== undefined ? stats.level : currentUser.level,
                    };

                    set({ user: updatedUser });
                } catch (err) {
                    console.error('Failed to update user stats:', err);
                }
            },

            clearAllStorages: () => {
                clearUserStorages();
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
            version: 1, // Add version number for state versioning
            migrate: (persistedState: unknown, version: number) => {
                if (version === 0) {
                    // Handle migration from version 0 to version 1
                    // Safe type checking and migration
                    const typedState = persistedState as { user?: User | null };
                    return { 
                        user: typedState?.user || null 
                    };
                }
                return persistedState as { user: User | null };
            }
        }
    )
) 