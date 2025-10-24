import { useState, useEffect, useCallback } from 'react';

interface UseUserImageReturn {
  image: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useUserImage = (userId?: string): UseUserImageReturn => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userId}/image`);
      
      if (response.status === 404) {
        // User has no image
        setImage(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user image');
      }

      const data = await response.json();
      setImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
      setImage(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return {
    image,
    loading,
    error,
    refetch: fetchImage
  };
};

export const useCurrentUserImage = (): UseUserImageReturn => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/me/image', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 404) {
        // User has no image
        setImage(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user image');
      }

      const data = await response.json();
      setImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  return {
    image,
    loading,
    error,
    refetch: fetchImage
  };
};