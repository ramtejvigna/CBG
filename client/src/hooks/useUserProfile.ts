import { useProfileStore, UserProfile } from '../lib/store/profileStore';

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
    clearProfile: () => void;
}

export const useUserProfile = (): UseUserProfileReturn => {
    const {
        userData,
        loading,
        error,
        fetchUserProfileById,
        fetchUserProfileByUsername,
        updateUserProfile,
        refreshProfile,
        clearProfile
    } = useProfileStore();

    return {
        userData,
        loading,
        error,
        fetchUserProfileById,
        fetchUserProfileByUsername,
        updateUserProfile,
        refreshProfile,
        clearProfile,
    };
};

export default useUserProfile;