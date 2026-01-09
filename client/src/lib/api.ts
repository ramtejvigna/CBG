/* eslint-disable */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    requireAuth?: boolean;
}

class ApiError extends Error {
    status: number;
    
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

export const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
    const {
        method = 'GET',
        headers = {},
        body,
        requireAuth = false
    } = options;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    // Add authentication if required
    if (requireAuth) {
        const token = sessionStorage.getItem('session-token');
        if (token) {
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            };
        }
    }

    // Add body if provided
    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Handle non-200 responses
        if (!response.ok) {
            let errorMessage = 'An error occurred';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {
                // If we can't parse the error response, use a generic message
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new ApiError(errorMessage, response.status);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return null;
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Handle network errors or other fetch errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new ApiError('Network error: Please check your connection', 0);
        }
        
        throw new ApiError('An unexpected error occurred', 500);
    }
};

// Specific API functions for common operations
export const api = {
    // Authentication
    adminLogin: (credentials: { email: string; password: string }) =>
        apiCall('/api/admin/login', { method: 'POST', body: credentials }),
    
    // User management
    getUsers: (params: Record<string, string> = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/api/admin/users?${queryString}`, { requireAuth: true });
    },
    
    updateUser: (userId: string, userData: any) =>
        apiCall(`/api/admin/users/${userId}`, { 
            method: 'PUT', 
            body: userData, 
            requireAuth: true 
        }),
    
    deleteUser: (userId: string) =>
        apiCall(`/api/admin/users/${userId}`, { 
            method: 'DELETE', 
            requireAuth: true 
        }),
    
    // Challenge management
    getChallenges: (params: Record<string, string> = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/api/admin/challenges?${queryString}`, { requireAuth: true });
    },
    
    getChallengeStats: () =>
        apiCall('/api/admin/challenges/stats', { requireAuth: true }),
    
    createChallenge: (challengeData: any) =>
        apiCall('/api/challenges', { 
            method: 'POST', 
            body: challengeData, 
            requireAuth: true 
        }),
    
    updateChallenge: (challengeId: string, challengeData: any) =>
        apiCall(`/api/challenges/${challengeId}`, { 
            method: 'PUT', 
            body: challengeData, 
            requireAuth: true 
        }),
    
    deleteChallenge: (challengeId: string) =>
        apiCall(`/api/admin/challenges/${challengeId}`, { 
            method: 'DELETE', 
            requireAuth: true 
        }),
    
    // Contest management
    getContests: (params: Record<string, string> = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/api/admin/contests?${queryString}`, { requireAuth: true });
    },
    
    getContestStats: () =>
        apiCall('/api/admin/contests/stats', { requireAuth: true }),
    
    createContest: (contestData: any) =>
        apiCall('/api/contests/create', { 
            method: 'POST', 
            body: contestData, 
            requireAuth: true 
        }),
    
    updateContest: (contestId: string, contestData: any) =>
        apiCall(`/api/admin/contests/${contestId}`, { 
            method: 'PUT', 
            body: contestData, 
            requireAuth: true 
        }),
    
    deleteContest: (contestId: string) =>
        apiCall(`/api/admin/contests/${contestId}`, { 
            method: 'DELETE', 
            requireAuth: true 
        }),
    
    // Categories
    getCategories: () =>
        apiCall('/api/categories'),
    
    // Statistics
    getStatistics: () =>
        apiCall('/api/statistics'),
    
    // Dashboard
    getDashboardStats: () =>
        apiCall('/api/admin/dashboard/stats', { requireAuth: true }),
    
    getRecentActivities: (params: Record<string, string> = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/api/admin/dashboard/activities?${queryString}`, { requireAuth: true });
    },
    
    getSystemStatus: () =>
        apiCall('/api/admin/dashboard/system-status', { requireAuth: true })
};

export { ApiError };