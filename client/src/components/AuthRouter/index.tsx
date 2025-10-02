"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';

interface AuthRouterProps {
  children: React.ReactNode;
}

export const AuthRouter = ({ children }: AuthRouterProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { checkAuth, user, loading } = useAuthStore();
  const { theme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
    }
  }, [theme]);

  // Check auth status on initial load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle protected routes and redirects
  useEffect(() => {
    if (!loading) {
      const protectedRoutes = [
        '/profile',
        '/challenge',
        '/certifications',
        '/settings',
        '/battles'
      ];

      if (!user && protectedRoutes.some(route => pathname?.startsWith(route))) {
        router.push('/login');
      }

      if (user) {
        const authRoutes = ['/login', '/signup'];
        if (authRoutes.includes(pathname || '')) {
          if (user.role === "USER") {
            router.push('/');
          } else if (user.role === "ADMIN") {
            router.push('/admin');
          }
        }
      }
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
};