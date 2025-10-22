"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useAuthStore, User } from '../lib/store/authStore';

// Define auth context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (userData: Partial<User> & { password: string }) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    
    const { 
        user, 
        loading, 
        error,
        checkAuth,
        login: storeLogin,
        signup: storeSignup,
        logout: storeLogout,
        setError
    } = useAuthStore();

    // Check auth status on initial load and sync with NextAuth
    useEffect(() => {
        const handleAuth = async () => {
            if (status === 'loading') return; // Still loading NextAuth

            if (session?.user) {
                // User is authenticated via NextAuth
                // Update the auth store with session data for consistency
                const { setUser } = useAuthStore.getState();
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.name || '',
                    username: session.user.username || '',
                    image: session.user.image || '',
                    needsOnboarding: session.user.needsOnboarding
                } as any);
            } else {
                // No NextAuth session, try custom auth check
                await checkAuth();
            }
        };

        handleAuth();
    }, [session, status, checkAuth]);

    // Handle protected routes and redirects
    useEffect(() => {
        // Wait for authentication to complete
        if (status === 'loading' || loading) return;

        const protectedRoutes = [
            '/profile',
            '/challenges',
            '/contests',
            '/certifications',
            '/settings',
            '/battles',
            '/onboarding'
        ];

        const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
        const currentUser = session?.user || user;

        if (!currentUser && isProtectedRoute) {
            router.push('/login');
        }

        if (currentUser) {
            const authRoutes = ['/login', '/signup'];
            if (authRoutes.includes(pathname || '')) {
                const needsOnboarding = 'needsOnboarding' in currentUser ? currentUser.needsOnboarding : false;
                if (needsOnboarding) {
                    router.push('/onboarding');
                } else {
                    router.push('/');
                }
            }
        }
    }, [session, user, loading, status, pathname, router]);

    const login = async (email: string, password: string) => {
        try {
            await storeLogin(email, password);
            router.push('/profile');
        } catch (err) {
            // Error is already handled in the store
            throw new Error('Login failed');
        }
    };

    const signup = async (userData: Partial<User> & { password: string }) => {
        try {
            await storeSignup(userData);
            router.push('/profile');
        } catch (err) {
            // Error is already handled in the store
            throw new Error('Signup failed');
        }
    };

    const logout = async () => {
        try {
            await storeLogout();
            await signOut({ redirect: false });
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const clearError = () => {
        setError(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, signup, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};