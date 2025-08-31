import type { User, Challenge, Submission, UserProfile } from './models.js';

// Utility type to create request body types
export type WithoutSystemFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Common request body types
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'lastActive'>;
export type UpdateUserInput = Partial<WithoutSystemFields<User>>;

export type CreateChallengeInput = Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateChallengeInput = Partial<WithoutSystemFields<Challenge>>;

export type CreateSubmissionInput = Omit<Submission, 'id' | 'createdAt' | 'status' | 'runtime' | 'memory' | 'testResults'>;

export type CreateUserProfileInput = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserProfileInput = Partial<WithoutSystemFields<UserProfile>>;

// Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ChallengeQueryParams extends PaginationParams {
  difficulty?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
