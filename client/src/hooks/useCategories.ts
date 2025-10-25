import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface Category {
    id: string;
    name: string;
    description?: string;
}

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return {
        categories,
        loading,
        error,
        fetchCategories
    };
};