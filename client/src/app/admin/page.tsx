"use client";

import React from 'react';
import Link from 'next/link';
import { 
    Users, 
    Trophy, 
    Code2, 
    Activity, 
    TrendingUp, 
    Calendar,
    AlertTriangle,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useThemeStore } from '@/lib/store/themeStore';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import StatCard from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
    const { theme } = useThemeStore();
    const {
        stats,
        activities: recentActivities,
        systemStatus,
        loading,
        error,
        fetchDashboardData
    } = useAdminDashboard();

    const getActivityIcon = (type: 'user_signup' | 'challenge_created' | 'contest_started' | 'submission_made') => {
        switch (type) {
            case 'user_signup':
                return <Users className="w-4 h-4 text-blue-500" />;
            case 'challenge_created':
                return <Code2 className="w-4 h-4 text-green-500" />;
            case 'contest_started':
                return <Trophy className="w-4 h-4 text-purple-500" />;
            case 'submission_made':
                return <CheckCircle className="w-4 h-4 text-orange-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getSystemStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'offline':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getSystemStatusText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (error) {
        return (
            <div className="space-y-6">
                <div className={`p-4 rounded-lg border border-red-300 ${
                    theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-800'
                }`}>
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Error loading dashboard</span>
                    </div>
                    <p className="mt-2 text-sm">{error}</p>
                    <Button 
                        onClick={fetchDashboardData} 
                        className="mt-3"
                        variant="outline"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Admin Dashboard
                </h1>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Welcome back! Here's what's happening on Code Battle Ground.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    change={{ value: stats?.userGrowth || 0, type: 'increase' }}
                    icon={Users}
                    loading={loading}
                />
                <StatCard
                    title="Total Challenges"
                    value={stats?.totalChallenges || 0}
                    change={{ value: stats?.challengeGrowth || 0, type: 'increase' }}
                    icon={Code2}
                    loading={loading}
                />
                <StatCard
                    title="Active Contests"
                    value={stats?.totalContests || 0}
                    change={{ value: stats?.contestGrowth || 0, type: 'increase' }}
                    icon={Trophy}
                    loading={loading}
                />
                <StatCard
                    title="Submissions Today"
                    value={stats?.activeSubmissions || 0}
                    change={{ 
                        value: stats?.submissionGrowth || 0, 
                        type: (stats?.submissionGrowth || 0) >= 0 ? 'increase' : 'decrease' 
                    }}
                    icon={TrendingUp}
                    loading={loading}
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Recent Activities
                        </h2>
                        <Activity className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-3 animate-pulse">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {activity.description}
                                        </p>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {activity.user && `by ${activity.user} • `}
                                            {formatTimestamp(activity.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Quick Actions
                        </h2>
                        <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    
                    <div className="space-y-3">
                        <Link href="/admin/challenges" className={`block w-full text-left p-3 rounded-md border transition-colors ${
                            theme === 'dark' 
                                ? 'border-gray-600 hover:bg-gray-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                            <div className="flex items-center space-x-3">
                                <Code2 className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Create New Challenge
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Add a new coding challenge
                                    </p>
                                </div>
                            </div>
                        </Link>
                        
                        <Link href="/admin/contests" className={`block w-full text-left p-3 rounded-md border transition-colors ${
                            theme === 'dark' 
                                ? 'border-gray-600 hover:bg-gray-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                            <div className="flex items-center space-x-3">
                                <Trophy className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Schedule Contest
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Create a new contest event
                                    </p>
                                </div>
                            </div>
                        </Link>
                        
                        <Link href="/admin/users" className={`block w-full text-left p-3 rounded-md border transition-colors ${
                            theme === 'dark' 
                                ? 'border-gray-600 hover:bg-gray-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Manage Users
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        View and manage user accounts
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* System Overview */}
            <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    System Status
                </h2>
                
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3 animate-pulse">
                                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                <div className="h-4 bg-gray-300 rounded w-24"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getSystemStatusColor(systemStatus?.database || 'offline')}`}></div>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Database: {getSystemStatusText(systemStatus?.database || 'Unknown')}
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getSystemStatusColor(systemStatus?.codeExecution || 'offline')}`}></div>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Code Execution: {getSystemStatusText(systemStatus?.codeExecution || 'Unknown')}
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getSystemStatusColor(systemStatus?.emailService || 'offline')}`}></div>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                Email Service: {getSystemStatusText(systemStatus?.emailService || 'Unknown')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;