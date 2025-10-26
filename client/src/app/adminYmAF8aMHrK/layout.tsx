"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users,
    Trophy,
    Settings,
    BarChart3,
    Code2,
    Shield,
    LogOut,
    Menu,
    X,
    Home
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import Loader from '@/components/Loader';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();
    const { user, loading, logout } = useAuthStore();
    const { theme } = useThemeStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <Loader />;
    }

    if (!user || user.role !== 'ADMIN') {
        router.push('/admin/login');
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Challenge Management', href: '/admin/challenges', icon: Code2 },
        { name: 'Contest Management', href: '/admin/contests', icon: Trophy },
        { name: 'System Settings', href: '/admin/settings', icon: Settings },
    ];

    const handleLogout = async () => {
        await logout();
        router.push('/admin/login');
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <Link href="/" className="flex items-center space-x-2">
                            <Shield className="w-8 h-8 text-orange-500" />
                            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                CBG Admin
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-1 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark'
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    {user && user.role === 'ADMIN' && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className={`mb-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Logged in as: <span className="font-medium">{user?.name || user?.username}</span>
                            </div>
                            <div className="space-y-2">
                                <Link
                                    href="/"
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark'
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <Home className="w-5 h-5 mr-3" />
                                    Back to Site
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${theme === 'dark'
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <LogOut className="w-5 h-5 mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 ease-in-out`}>
                {/* Top bar */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Admin Panel - {new Date().toLocaleDateString()}
                    </div>
                </div>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;