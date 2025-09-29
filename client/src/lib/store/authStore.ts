import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string;
    email: string;
    username: string;
    name?: string;
    fullName?: string;
    preferredLanguage?: string;
    image?: string;
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
                    const token = localStorage.getItem('auth-token');
                    if (token) {
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (response.ok) {
                            const userData = await response.json();
                            set({ user: userData });
                        } else {
                            localStorage.removeItem('auth-token');
                        }
                    }
                } catch (err) {
                    console.error('Auth check failed:', err);
                    localStorage.removeItem('auth-token');
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
                    
                    if (data.success && data.token) {
                        localStorage.setItem('auth-token', data.token);
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

                    if (data.success && data.token) {
                        localStorage.setItem('auth-token', data.token);
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
                    const token = localStorage.getItem('auth-token');
                    if (token) {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                    }
                    localStorage.removeItem('auth-token');
                    set({ user: null });
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