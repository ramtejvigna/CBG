import { useEffect } from 'react';
import { useChallengesStore, Challenge } from '../lib/store/challengesStore';

interface UseChallengeReturn {
    challenge: Challenge | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useChallenge = (slug: string): UseChallengeReturn => {
    const {
        currentChallenge,
        challengeLoading,
        challengeError,
        fetchChallenge,
        refetchChallenge
    } = useChallengesStore();

    useEffect(() => {
        if (slug) {
            fetchChallenge(slug);
        }
    }, [slug, fetchChallenge]);

    return {
        challenge: currentChallenge,
        loading: challengeLoading,
        error: challengeError,
        refetch: refetchChallenge,
    };
};

export default useChallenge;