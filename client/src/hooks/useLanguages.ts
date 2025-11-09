import { useEffect } from 'react';
import { useLanguagesStore, Language } from '../lib/store/languagesStore';

interface UseLanguagesReturn {
  languages: Language[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLanguages = (): UseLanguagesReturn => {
  const {
    languages,
    loading,
    error,
    fetchLanguages,
    refetch
  } = useLanguagesStore();

  useEffect(() => {
    fetchLanguages();
  }, []); // Remove fetchLanguages from dependencies

  return {
    languages,
    loading,
    error,
    refetch
  };
};

export default useLanguages;