export interface User {
    id: string;
    email: string;
    password?: string | null;
    name?: string | null;
    username: string;
    image?: string | null;
    emailVerified?: Date | null;
    githubConnected: boolean;
    githubUsername?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: string;
    lastActive?: Date | null;
}

export interface UserProfile {
    id: string;
    userId: string;
    rank?: number | null;
    bio: string;
    phone?: string | null;
    solved: number;
    preferredLanguage: string;
    level: number;
    points: number;
    streakDays: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Activity {
    id: string;
    userId: string;
    type: ActivityType;
    name: string;
    result: string;
    points: number;
    time: string;
    createdAt: Date;
}

export interface Account {
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
}

export interface Session {
    id: string;
    sessionToken: string;
    userId: string;
    expires: Date;
}

export interface VerificationToken {
    identifier: string;
    token: string;
    expires: Date;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    iconType: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Language {
    id: string;
    name: string;
    percentage: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    points: number;
    creatorId: string;
    categoryId: string;
    challengeType?: ChallengeType | null;
    timeLimit: number;
    memoryLimit: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChallengeCategory {
    id: string;
    name: string;
    description?: string | null;
}

export interface TestCase {
    id: string;
    challengeId: string;
    input: string;
    output: string;
    isHidden: boolean;
    explanation?: string | null;
}

export interface Submission {
    id: string;
    userId: string;
    challengeId: string;
    code: string;
    languageId: string;
    status: SubmissionStatus;
    runtime?: number | null;
    memory?: number | null;
    createdAt: Date;
    testResults?: any; // You might want to define a more specific type for test results
}

export interface ChallengeAttempt {
    id: string;
    userId: string;
    challengeId: string;
    startedAt: Date;
    completedAt?: Date | null;
    successful?: boolean | null;
}

export interface ChallengeLike {
    id: string;
    userId: string;
    challengeId: string;
    isLike: boolean;
    createdAt: Date;
}

export interface AdminLead {
    id: string;
    userId: string;
    department: string;
    responsibilities: string[];
    accessLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

export enum ChallengeType {
    SYSTEM_DESIGN = 'SYSTEM_DESIGN',
    ALGORITHM = 'ALGORITHM',
    DATA_STRUCTURE = 'DATA_STRUCTURE'
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
    EXPERT = 'EXPERT'
}

export enum SubmissionStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    WRONG_ANSWER = 'WRONG_ANSWER',
    TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
    MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
    RUNTIME_ERROR = 'RUNTIME_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR'
}

export enum ActivityType {
    CHALLENGE = 'CHALLENGE',
    CONTEST = 'CONTEST',
    BADGE = 'BADGE',
    DISCUSSION = 'DISCUSSION'
}
