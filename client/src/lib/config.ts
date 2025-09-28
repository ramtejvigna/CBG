// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
        CHALLENGES: '/api/challenges',
        LANGUAGES: '/api/languages',
        EXECUTE: '/api/execute',
        AUTH: '/api/auth',
        USERS: '/api/users',
    }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;

    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    return url;
};

// Helper function for API requests with error handling
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint);

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API request failed for ${url}:`, error);
        throw error;
    }
};