import { useState, useEffect } from 'react';

export interface Language {
  id: string;
  name: string;
}

interface UseLanguagesReturn {
  languages: Language[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLanguages = (): UseLanguagesReturn => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/languages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }

      const data = await response.json();
      
      if (data.success && data.languages) {
        setLanguages(data.languages);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const refetch = async () => {
    await fetchLanguages();
  };

  return {
    languages,
    loading,
    error,
    refetch
  };
};

export default useLanguages;