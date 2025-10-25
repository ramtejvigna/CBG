import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface DashboardStats {
    totalUsers: number;
    totalChallenges: number;
    totalContests: number;
    activeSubmissions: number;
    userGrowth: number;
    challengeGrowth: number;
    contestGrowth: number;
    submissionGrowth: number;
}

interface RecentActivity {
    id: string;
    type: 'user_signup' | 'challenge_created' | 'contest_started' | 'submission_made';
    description: string;
    timestamp: string;
    user?: string;
}

interface SystemStatus {
    database: string;
    codeExecution: string;
    emailService: string;
}

export const useAdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Fetch all dashboard data in parallel
            const [statsData, activitiesData, statusData] = await Promise.all([
                api.getDashboardStats(),
                api.getRecentActivities({ limit: '10' }),
                api.getSystemStatus()
            ]);

            setStats(statsData);
            setActivities(activitiesData);
            setSystemStatus(statusData);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshStats = async () => {
        try {
            const statsData = await api.getDashboardStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to refresh stats:', err);
        }
    };

    const refreshActivities = async () => {
        try {
            const activitiesData = await api.getRecentActivities({ limit: '10' });
            setActivities(activitiesData);
        } catch (err) {
            console.error('Failed to refresh activities:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return {
        stats,
        activities,
        systemStatus,
        loading,
        error,
        fetchDashboardData,
        refreshStats,
        refreshActivities
    };
};