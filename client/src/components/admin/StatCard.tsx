"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        type: 'increase' | 'decrease';
    };
    icon: LucideIcon;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, loading }) => {
    const { theme } = useThemeStore();

    if (loading) {
        return (
            <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } animate-pulse`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } hover:shadow-lg transition-shadow duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        {title}
                    </p>
                    <p className={`text-3xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                        {value}
                    </p>
                    {change && (
                        <p className={`text-sm mt-1 ${
                            change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                    <Icon className={`w-6 h-6 text-orange-500`} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;