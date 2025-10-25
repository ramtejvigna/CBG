"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';

interface AdminToggleProps {
    className?: string;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ className = '' }) => {
    const { user } = useAuthStore();
    const { theme } = useThemeStore();

    // Only show for admin users
    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            {/* Admin Panel Link */}
            <Link
                href="/admin"
                className={`group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    theme === 'dark'
                        ? 'bg-orange-900/20 text-orange-200 hover:bg-orange-800/30 border border-orange-800/30'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                } hover:scale-105 hover:shadow-lg`}
            >
                <Shield className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                <span>Admin Panel</span>
            </Link>

            {/* User Area Link (for quick switch back) */}
            <Link
                href="/challenges"
                className={`group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    theme === 'dark'
                        ? 'bg-blue-900/20 text-blue-200 hover:bg-blue-800/30 border border-blue-800/30'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                } hover:scale-105 hover:shadow-lg`}
            >
                <Users className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                <span>User Area</span>
            </Link>
        </div>
    );
};

export default AdminToggle;