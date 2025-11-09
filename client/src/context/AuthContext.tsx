"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useAuthStore, User, clearNextAuthStorageAndCookies } from '../lib/store/authStore';

// Extend the session type to include sessionToken
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username?: string | null;
      image?: string | null;
      needsOnboarding?: boolean;
      sessionToken?: string;
    };
  }
}

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
                    id: session.user.id || '',
                    email: session.user.email || '',
                    name: session.user.name || '',
                    username: session.user.username || '',
                    image: session.user.image || '',
                    needsOnboarding: session.user.needsOnboarding || false
                } as User);
                console.log('Session data:', session);
                // If there's a session token from social login, store it
                if (session.user.sessionToken) {
                    console.log('Storing sessionToken from NextAuth session:', session.user.sessionToken);
                    const { setSessionToken } = await import('../lib/auth');
                    setSessionToken(session.user.sessionToken);
                } else {
                    console.log('No sessionToken found in NextAuth session');
                }
            } else if (status === 'unauthenticated') {
                // NextAuth confirms no session exists
                // Check if we have a custom session token, otherwise clear user data
                const { getSessionToken } = await import('../lib/auth');
                const sessionToken = getSessionToken();
                
                if (sessionToken) {
                    // We have a custom session token, try to authenticate with it
                    await checkAuth();
                } else {
                    // No session token either, ensure user is cleared
                    const { setUser } = useAuthStore.getState();
                    setUser(null);
                }
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
        } catch {
            // Error is already handled in the store
            throw new Error('Login failed');
        }
    };

    const signup = async (userData: Partial<User> & { password: string }) => {
        try {
            await storeSignup(userData);
            router.push('/profile');
        } catch {
            // Error is already handled in the store
            throw new Error('Signup failed');
        }
    };

    const logout = async () => {
        try {
            console.log('Starting logout process...');
            
            // First clear our custom auth store
            await storeLogout();
            
            // Clear NextAuth storage and cookies
            console.log('Clearing NextAuth storage and cookies...');
            clearNextAuthStorageAndCookies();
            
            // Then call NextAuth signOut to clear the NextAuth session
            console.log('Calling NextAuth signOut...');
            await signOut({ 
                redirect: false,
                callbackUrl: '/login'
            });
            
            console.log('Logout completed, redirecting to login');
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            // Even if there's an error, try to redirect to login
            router.push('/login');
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