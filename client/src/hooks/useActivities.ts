import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';

export interface Activity {
    id: string;
    userId: string;
    type: 'CHALLENGE' | 'CONTEST' | 'BADGE' | 'DISCUSSION';
    name: string;
    result: string;
    points: number;
    time: string;
    createdAt: string;
    user: {
        username: string;
        image: string | null;
    };
}

export interface ActivityStats {
    totalActivities: number;
    typeBreakdown: Record<string, number>;
    totalPoints: number;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ActivitiesResponse {
    activities: Activity[];
    pagination: PaginationInfo;
    statistics: ActivityStats;
}

interface UseActivitiesParams {
    page?: number;
    limit?: number;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface UseActivitiesResult {
    activities: Activity[];
    pagination: PaginationInfo | null;
    statistics: ActivityStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setPage: (page: number) => void;
    setFilter: (filter: string) => void;
}

const useActivities = (params: UseActivitiesParams = {}): UseActivitiesResult => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [statistics, setStatistics] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentParams, setCurrentParams] = useState<UseActivitiesParams>({
        page: 1,
        limit: 10,
        ...params
    });

    const { user } = useAuthStore();

    const fetchActivities = useCallback(async () => {
        if (!user?.username) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            Object.entries(currentParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "" && value !== "all") {
                    queryParams.append(key, value.toString());
                }
            });

            const token = localStorage.getItem('auth-token')

            // Use environment variable or fallback to relative path for development
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            const url = `${baseUrl}/api/activity${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ActivitiesResponse = await response.json();
            
            setActivities(data.activities || []);
            setPagination(data.pagination || null);
            setStatistics(data.statistics || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    }, [currentParams, user?.username]);

    useEffect(() => {
        if (user?.username) {
            fetchActivities();
        }
    }, [fetchActivities, user?.username]);

    const refetch = useCallback(async () => {
        await fetchActivities();
    }, [fetchActivities]);

    const setPage = useCallback((page: number) => {
        setCurrentParams(prev => ({ ...prev, page }));
    }, []);

    const setFilter = useCallback((type: string) => {
        const filterType = type === "all" ? undefined : type;
        setCurrentParams(prev => ({ ...prev, type: filterType, page: 1 })); // Reset to page 1 when filtering
    }, []);

    return {
        activities,
        pagination,
        statistics,
        loading,
        error,
        refetch,
        setPage,
        setFilter
    };
};

export default useActivities;