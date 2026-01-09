import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface PlatformStatistics {
    codingBattles: number;
    activeWarriors: number;
    problemSet: number;
    languages: number;
}

export const useStatistics = () => {
    const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await api.getStatistics();
            setStatistics(data);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    return {
        statistics,
        loading,
        error,
        refetch: fetchStatistics
    };
};
