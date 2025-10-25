import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    points: number;
    category: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    submissions: number;
    acceptanceRate: number;
    timeLimit: number;
    memoryLimit: number;
    status: 'draft' | 'published' | 'archived';
    creator: {
        name: string;
        username: string;
    };
    testCases: number;
}

interface ChallengeFilter {
    difficulty: string;
    category: string;
    status: string;
    search: string;
}

interface ChallengeStats {
    total: number;
    published: number;
    draft: number;
    totalSubmissions: number;
}

export const useAdminChallenges = (filters: ChallengeFilter, page: number, limit: number) => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [stats, setStats] = useState<ChallengeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalChallenges, setTotalChallenges] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchChallenges = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const queryParams: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString()
            };

            if (filters.search) queryParams.search = filters.search;
            if (filters.difficulty) queryParams.difficulty = filters.difficulty;
            if (filters.category) queryParams.category = filters.category;
            if (filters.status) queryParams.status = filters.status;

            const data = await api.getChallenges(queryParams);
            setChallenges(data.challenges);
            setTotalChallenges(data.pagination.total);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            setChallenges([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.getChallengeStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch challenge stats:', err);
        }
    };

    const createChallenge = async (challengeData: Partial<Challenge>) => {
        const result = await api.createChallenge(challengeData);
        await fetchChallenges();
        await fetchStats();
        return result;
    };

    const updateChallenge = async (challengeId: string, challengeData: Partial<Challenge>) => {
        const result = await api.updateChallenge(challengeId, challengeData);
        await fetchChallenges();
        await fetchStats();
        return result;
    };

    const deleteChallenge = async (challengeId: string) => {
        const result = await api.deleteChallenge(challengeId);
        await fetchChallenges();
        await fetchStats();
        return result;
    };

    useEffect(() => {
        fetchChallenges();
        fetchStats();
    }, [filters, page]);

    return {
        challenges,
        stats,
        loading,
        error,
        totalChallenges,
        totalPages,
        fetchChallenges,
        createChallenge,
        updateChallenge,
        deleteChallenge
    };
};