import NodeCache from 'node-cache';
import prisma from './prisma.js';

// Create cache instances with different TTL values
const shortCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const mediumCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

// Cache keys
export const CACHE_KEYS = {
    LANGUAGES: 'languages',
    CATEGORIES: 'categories',
    USER_PROFILE: (userId: string) => `user_profile_${userId}`,
    USER_BASIC: (userId: string) => `user_basic_${userId}`,
    CHALLENGE_BASIC: (challengeId: string) => `challenge_basic_${challengeId}`,
    LEADERBOARD: 'leaderboard',
    HOME_CHALLENGES: 'home_challenges',
    CHALLENGE_COUNT: (challengeId: string) => `challenge_count_${challengeId}`,
    USER_SUBMISSIONS_COUNT: (userId: string) => `user_submissions_${userId}`,
};

// Generic cache operations
export const cache = {
    get: <T>(key: string): T | undefined => {
        return shortCache.get<T>(key) || mediumCache.get<T>(key) || longCache.get<T>(key);
    },
    
    setShort: <T>(key: string, value: T): boolean => {
        return shortCache.set(key, value);
    },
    
    setMedium: <T>(key: string, value: T): boolean => {
        return mediumCache.set(key, value);
    },
    
    setLong: <T>(key: string, value: T): boolean => {
        return longCache.set(key, value);
    },
    
    del: (key: string): number => {
        return shortCache.del(key) + mediumCache.del(key) + longCache.del(key);
    },
    
    flush: (): void => {
        shortCache.flushAll();
        mediumCache.flushAll();
        longCache.flushAll();
    },
    
    keys: (): string[] => {
        return [...shortCache.keys(), ...mediumCache.keys(), ...longCache.keys()];
    }
};

// Cached data fetchers
export const getCachedLanguages = async () => {
    const cached = cache.get(CACHE_KEYS.LANGUAGES);
    if (cached) return cached;

    const languages = await prisma.language.findMany({
        select: {
            id: true,
            name: true,
            percentage: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    cache.setLong(CACHE_KEYS.LANGUAGES, languages);
    return languages;
};

export const getCachedCategories = async () => {
    const cached = cache.get(CACHE_KEYS.CATEGORIES);
    if (cached) return cached;

    const categories = await prisma.challengeCategory.findMany({
        select: {
            id: true,
            name: true,
            description: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    cache.setLong(CACHE_KEYS.CATEGORIES, categories);
    return categories;
};

export const getCachedUserProfile = async (userId: string) => {
    const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const userProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            userProfile: {
                select: {
                    bio: true,
                    phone: true,
                    solved: true,
                    preferredLanguage: true,
                    level: true,
                    rank: true
                }
            }
        }
    });

    if (userProfile) {
        cache.setMedium(cacheKey, userProfile);
    }
    return userProfile;
};

export const getCachedUserBasic = async (userId: string) => {
    const cacheKey = CACHE_KEYS.USER_BASIC(userId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            image: true,
            role: true
        }
    });

    if (user) {
        cache.setMedium(cacheKey, user);
    }
    return user;
};

export const getCachedChallengeBasic = async (challengeId: string) => {
    const cacheKey = CACHE_KEYS.CHALLENGE_BASIC(challengeId);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: {
            id: true,
            title: true,
            difficulty: true,
            points: true
        }
    });

    if (challenge) {
        cache.setMedium(cacheKey, challenge);
    }
    return challenge;
};

export const getCachedHomeChallenges = async () => {
    const cached = cache.get(CACHE_KEYS.HOME_CHALLENGES);
    if (cached) return cached;

    const challenges = await prisma.challenge.findMany({
        take: 4,
        select: {
            id: true,
            title: true,
            difficulty: true,
            points: true,
            description: true,
            createdAt: true,
            creator: {
                select: {
                    username: true,
                    image: true
                }
            },
            category: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    cache.setShort(CACHE_KEYS.HOME_CHALLENGES, challenges);
    return challenges;
};

// Cache invalidation helpers
export const invalidateUserCache = (userId: string) => {
    cache.del(CACHE_KEYS.USER_PROFILE(userId));
    cache.del(CACHE_KEYS.USER_BASIC(userId));
    cache.del(CACHE_KEYS.USER_SUBMISSIONS_COUNT(userId));
};

export const invalidateChallengeCache = (challengeId: string) => {
    cache.del(CACHE_KEYS.CHALLENGE_BASIC(challengeId));
    cache.del(CACHE_KEYS.CHALLENGE_COUNT(challengeId));
    cache.del(CACHE_KEYS.HOME_CHALLENGES);
};

// Cache statistics
export const getCacheStats = () => {
    return {
        shortCache: shortCache.getStats(),
        mediumCache: mediumCache.getStats(),
        longCache: longCache.getStats(),
        totalKeys: cache.keys().length
    };
};

export default cache;