import { useState, useCallback } from 'react';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    username: string;
    image?: string;
    role: string;
    createdAt: string;
    userProfile: {
        bio: string;
        phone?: string;
        solved: number;
        preferredLanguage: string;
        level: number;
        points: number;
        streakDays: number;
        rank?: number;
        badges: Array<{
            id: string;
            name: string;
            description: string;
            points: number;
            icon: string;
        }>;
        languages: Array<{
            id: string;
            name: string;
            percentage: number;
        }>;
    };
    stats?: {
        totalSubmissions: number;
        acceptedSubmissions: number;
        contestParticipations: number;
        successRate: number;
    };
}

interface UpdateProfileData {
    name?: string;
    email?: string;
    image?: string;
    profile?: {
        phone?: string;
        bio?: string;
        preferredLanguage?: string;
    };
}

interface UseUserProfileReturn {
    userData: UserProfile | null;
    loading: boolean;
    error: string | null;
    fetchUserProfileById: (userId: string) => Promise<void>;
    fetchUserProfileByUsername: (username: string) => Promise<void>;
    updateUserProfile: (userId: string, data: UpdateProfileData) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedId, setLastFetchedId] = useState<string | null>(null);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }, []);

    const fetchUserProfileById = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);
            setLastFetchedId(userId);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }

            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching user profile');
            setUserData(null);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    const fetchUserProfileByUsername = useCallback(async (username: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile/${username}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
            }

            const data = await response.json();
            setUserData(data);
            setLastFetchedId(data.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching user profile');
            setUserData(null);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    const updateUserProfile = useCallback(async (userId: string, updateData: UpdateProfileData) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userId}/profile`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updateData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update profile: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setUserData(data.user);
                return data.user;
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    const refreshProfile = useCallback(async () => {
        if (lastFetchedId) {
            await fetchUserProfileById(lastFetchedId);
        }
    }, [lastFetchedId, fetchUserProfileById]);

    return {
        userData,
        loading,
        error,
        fetchUserProfileById,
        fetchUserProfileByUsername,
        updateUserProfile,
        refreshProfile,
    };
};

export default useUserProfile;