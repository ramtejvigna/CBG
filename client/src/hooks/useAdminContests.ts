import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface Contest {
    id: string;
    title: string;
    description: string;
    status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
    startsAt: string;
    endsAt: string;
    registrationEnd: string;
    participants: number;
    maxParticipants: number | null;
    points: number;
    createdAt: string;
    creator: {
        name: string;
        username: string;
    };
    challenges: number;
    tags: string[];
}

interface ContestFilter {
    status: string;
    search: string;
    timeframe: string;
}

interface ContestStats {
    total: number;
    upcoming: number;
    ongoing: number;
    finished: number;
    totalParticipants: number;
}

export const useAdminContests = (filters: ContestFilter, page: number, limit: number) => {
    const [contests, setContests] = useState<Contest[]>([]);
    const [stats, setStats] = useState<ContestStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalContests, setTotalContests] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchContests = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const queryParams: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString()
            };

            if (filters.search) queryParams.search = filters.search;
            if (filters.status) queryParams.status = filters.status;
            if (filters.timeframe) queryParams.timeframe = filters.timeframe;

            const data = await api.getContests(queryParams);
            setContests(data.contests);
            setTotalContests(data.pagination.total);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            setContests([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.getContestStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch contest stats:', err);
        }
    };

    const createContest = async (contestData: Partial<Contest>) => {
        const result = await api.createContest(contestData);
        await fetchContests();
        await fetchStats();
        return result;
    };

    const updateContest = async (contestId: string, contestData: Partial<Contest>) => {
        const result = await api.updateContest(contestId, contestData);
        await fetchContests();
        await fetchStats();
        return result;
    };

    const deleteContest = async (contestId: string) => {
        const result = await api.deleteContest(contestId);
        await fetchContests();
        await fetchStats();
        return result;
    };

    useEffect(() => {
        fetchContests();
        fetchStats();
    }, [filters, page]);

    return {
        contests,
        stats,
        loading,
        error,
        totalContests,
        totalPages,
        fetchContests,
        createContest,
        updateContest,
        deleteContest
    };
};