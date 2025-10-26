"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/lib/store/themeStore';
import { useAuthStore } from '@/lib/store/authStore';
import LoginModeSwitcher from '@/components/admin/LoginModeSwitcher';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

const UnifiedLoginPage: React.FC = () => {
    const { theme } = useThemeStore();
    const { login } = useAuthStore();
    const router = useRouter();
    const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUserLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                await login(data.user, data.token);
                router.push('/challenges');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const UserLoginForm = () => (
        <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            handleUserLogin(email, password);
        }} className="space-y-6">
            <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                    Email Address
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                    } focus:ring-4 focus:outline-none`}
                    placeholder="Enter your email"
                />
            </div>

            <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                    } focus:ring-4 focus:outline-none`}
                    placeholder="Enter your password"
                />
            </div>

            {error && (
                <div className={`p-3 rounded-lg border ${
                    theme === 'dark'
                        ? 'bg-red-900/20 border-red-800/30 text-red-200'
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                } text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                    </div>
                ) : (
                    'Sign In'
                )}
            </button>

            <div className="text-center">
                <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                    Don&apos;t have an account?{' '}
                    <button
                        type="button"
                        onClick={() => router.push('/signup')}
                        className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                        Sign up here
                    </button>
                </p>
            </div>
        </form>
    );

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
            theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
        }`}>
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className={`text-3xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        Welcome Back
                    </h2>
                    <p className={`mt-2 text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Login Form Container */}
                <div className={`rounded-2xl shadow-xl p-8 ${
                    theme === 'dark'
                        ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200/50'
                }`}>
                    {/* Mode Switcher */}
                    <LoginModeSwitcher 
                        onModeChange={setLoginMode}
                        initialMode={loginMode}
                    />

                    {/* Login Forms */}
                    {loginMode === 'admin' ? (
                        <AdminLoginForm />
                    ) : (
                        <UserLoginForm />
                    )}
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UnifiedLoginPage;