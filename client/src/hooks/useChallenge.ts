import { useState, useEffect } from 'react';

interface Challenge {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    points: number;
    category: { name: string };
    testCases: Array<{
        id: string;
        input: string;
        output: string;
        isHidden: boolean;
        explanation?: string;
    }>;
    likes: number;
    dislikes: number;
    submissions: number;
    timeLimit: number;
    memoryLimit: number;
    creator: {
        id: string;
        username: string;
        image?: string;
    };
    submissionStats: {
        avgRuntime: number;
        avgMemory: number;
    };
    languages?: Array<{
        id: string;
        name: string;
    }>;
    _count?: {
        submissions: number;
        likes: number;
    };
}

interface UseChallengeReturn {
    challenge: Challenge | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useChallenge = (slug: string): UseChallengeReturn => {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChallenge = async () => {
        if (!slug) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/challenges/slug/${encodeURIComponent(slug)}`);
            if (response.ok) {
                const apiChallenge = await response.json();
                const mappedChallenge: Challenge = {
                    ...apiChallenge,
                    slug: slug,
                    dislikes: apiChallenge.dislikes || 0,
                    submissions: apiChallenge._count?.submissions || 0,
                    likes: apiChallenge._count?.likes || 0,
                    submissionStats: {
                        avgRuntime: 68,
                        avgMemory: 38.9
                    }
                };
                setChallenge(mappedChallenge);
            } else {
                throw new Error('Challenge not found');
            }
        } catch (apiError) {
            console.warn('Failed to fetch challenge from API:', apiError);
            setError('Failed to load challenge. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) {
            fetchChallenge();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const refetch = async () => {
        await fetchChallenge();
    };

    return {
        challenge,
        loading,
        error,
        refetch,
    };
};

export default useChallenge;