/**
 * Utility functions for session-based authentication
 */

// Get the current session token from sessionStorage
export const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null; 
  }
  return sessionStorage.getItem('session-token');
};

// Set the session token in sessionStorage
export const setSessionToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }
  sessionStorage.setItem('session-token', token);
};

// Remove the session token from sessionStorage
export const removeSessionToken = (): void => {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }
  sessionStorage.removeItem('session-token');
};

// Check if user is authenticated (has valid session token)
export const isAuthenticated = (): boolean => {
  return !!getSessionToken();
};

// Create authorization headers for API requests
export const createAuthHeaders = (): Record<string, string> => {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};