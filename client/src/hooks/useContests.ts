import { useEffect } from 'react';
import { useContestsStore } from '@/lib/store';

export const useContests = () => {
  const {
    contests,
    isLoading,
    error,
    registering,
    registrationSuccess,
    lastFetched,
    fetchContests,
    registerForContest,
    searchContests,
    getContestsByStatus,
    setError,
  } = useContestsStore();

  // Auto-fetch contests on first mount
  useEffect(() => {
    fetchContests();
  }, []);

  const refreshContests = () => {
    return fetchContests(true);
  };

  const handleRegistration = async (contestId: string) => {
    setError(null); // Clear any previous errors
    return await registerForContest(contestId);
  };

  const getFilteredContests = (
    activeTab: 'upcoming' | 'live' | 'past',
    searchQuery: string
  ) => {
    return searchContests(searchQuery, activeTab);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Data
    contests,
    isLoading,
    error,
    registering,
    registrationSuccess,
    lastFetched,
    
    // Actions
    refreshContests,
    handleRegistration,
    getFilteredContests,
    clearError,
    
    // Utility methods
    getContestsByStatus,
  };
};