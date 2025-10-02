import { useEffect } from 'react';
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

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchChallenges(options),
                fetchCategories()
            ]);
        };
        
        loadData();
    }, [options.category, options.difficulty, options.page, options.limit, fetchChallenges, fetchCategories]);

    return {
        challenges,
        categories,
        loading: isLoading,
        error,
        refetch: refetchChallenges,
    };
};

export default useChallenges;