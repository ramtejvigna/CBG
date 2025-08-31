import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string;
    email: string;
    username: string;
    fullName?: string;
    preferredLanguage?: string;
    image?: string;
    role?: string;
    level?: number;
    points?: number;
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
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
                    const response = await fetch('/api/auth/session');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.user) {
                            set({ user: data.user });
                        }
                    }
                } catch (err) {
                    console.error('Auth check failed:', err);
                } finally {
                    set({ loading: false });
                }
            },

            login: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Login failed');
                    }

                    set({ user: data.user });
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
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Signup failed');
                    }

                    set({ user: data.user });
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
                    await fetch('/api/auth/logout', { method: 'POST' });
                    set({ user: null });
                    localStorage.removeItem('user');
                } catch (err) {
                    console.error('Logout failed:', err);
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
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
) 