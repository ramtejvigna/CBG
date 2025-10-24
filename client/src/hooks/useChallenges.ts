import { useEffect, useMemo } from 'react';
import { useChallengesStore, Challenge, Category } from '../lib/store/challengesStore';

interface UseChallengesOptions {
    category?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
}

interface UseChallengesReturn {
    challenges: Challenge[];
    categories: Category[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useChallenges = (options: UseChallengesOptions = {}): UseChallengesReturn => {
    const {
        challenges,
        categories,
        isLoading,
        error,
        fetchChallenges,
        fetchCategories,
        refetchChallenges
    } = useChallengesStore();

    const stableOptions = useMemo(() => options, [
        options.category,
        options.difficulty,
        options.page,
        options.limit
    ])

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchChallenges(stableOptions)
            ]);
        };
        
        loadData();
    }, [stableOptions, fetchChallenges]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories])

    return {
        challenges,
        categories,
        loading: isLoading,
        error,
        refetch: refetchChallenges,
    };
};

export default useChallenges;