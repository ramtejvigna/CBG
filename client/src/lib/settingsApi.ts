import { apiCall } from './api';

// Types for settings
export interface NotificationSettings {
  id: string;
  userId: string;
  contestAlerts: boolean;
  leaderboardUpdates: boolean;
  streakAlerts: boolean;
  emailNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettings {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  passwordChangeRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  codeEditor: 'vs-dark' | 'vs-light' | 'hc-black' | 'hc-light';
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationSettingsInput {
  contestAlerts?: boolean;
  leaderboardUpdates?: boolean;
  streakAlerts?: boolean;
  emailNotifications?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface UpdateSecuritySettingsInput {
  twoFactorEnabled?: boolean;
}

export interface UpdateUserPreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  codeEditor?: 'vs-dark' | 'vs-light' | 'hc-black' | 'hc-light';
  timezone?: string;
}

// API response types
interface SettingsResponse<T> {
  success: boolean;
  settings?: T;
  preferences?: T;
  message?: string;
}

export const settingsApi = {
  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiCall('/api/settings/notifications', { requireAuth: true });
    if (!response.settings) {
      throw new Error('Invalid response format');
    }
    return response.settings;
  },

  async updateNotificationSettings(data: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    const response = await apiCall('/api/settings/notifications', { 
      method: 'PUT', 
      body: data, 
      requireAuth: true 
    });
    if (!response.settings) {
      throw new Error('Invalid response format');
    }
    return response.settings;
  },

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await apiCall('/api/settings/security', { requireAuth: true });
    if (!response.settings) {
      throw new Error('Invalid response format');
    }
    return response.settings;
  },

  async updateSecuritySettings(data: UpdateSecuritySettingsInput): Promise<SecuritySettings> {
    const response = await apiCall('/api/settings/security', { 
      method: 'PUT', 
      body: data, 
      requireAuth: true 
    });
    if (!response.settings) {
      throw new Error('Invalid response format');
    }
    return response.settings;
  },

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences> {
    const response = await apiCall('/api/settings/preferences', { requireAuth: true });
    if (!response.preferences) {
      throw new Error('Invalid response format');
    }
    return response.preferences;
  },

  async updateUserPreferences(data: UpdateUserPreferencesInput): Promise<UserPreferences> {
    const response = await apiCall('/api/settings/preferences', { 
      method: 'PUT', 
      body: data, 
      requireAuth: true 
    });
    if (!response.preferences) {
      throw new Error('Invalid response format');
    }
    return response.preferences;
  },
};