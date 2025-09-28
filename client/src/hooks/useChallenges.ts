import { useState, useEffect } from 'react';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    points: number;
    timeLimit: number;
    memoryLimit: number;
    challengeType?: 'ALGORITHM' | 'DATA_STRUCTURE' | 'SYSTEM_DESIGN' | null;
    createdAt: string;
    updatedAt: string;
    creator: {
        id: string;
        username: string;
        image?: string;
    };
    category: {
        id: string;
        name: string;
        description?: string;
    };
    languages: Array<{
        id: string;
        name: string;
    }>;
    testCases: Array<{
        id: string;
        input: string;
        output: string;
        explanation?: string;
    }>;
    _count: {
        submissions: number;
        likes: number;
    };
}

export interface Category {
    id: string;
    name: string;
    description?: string;
}

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
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            if (options.category && options.category !== 'all') {
                params.append('category', options.category);
            }
            if (options.difficulty && options.difficulty !== 'all') {
                params.append('difficulty', options.difficulty);
            }
            if (options.page) {
                params.append('page', options.page.toString());
            }
            if (options.limit) {
                params.append('limit', options.limit.toString());
            }

            const queryString = params.toString();
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/challenges/filter${queryString ? '?' + queryString : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch challenges: ${response.statusText}`);
            }

            const data = await response.json();
            setChallenges(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching challenges');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
            if (!response.ok) {
                throw new Error(`Failed to fetch categories: ${response.statusText}`);
            }

            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Don't set error for categories as they're not critical
        }
    };

    useEffect(() => {
        Promise.all([fetchChallenges(), fetchCategories()]);
    }, [options.category, options.difficulty, options.page, options.limit]);

    const refetch = async () => {
        await fetchChallenges();
    };

    return {
        challenges,
        categories,
        loading,
        error,
        refetch,
    };
};

export default useChallenges;