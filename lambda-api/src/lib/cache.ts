import NodeCache from 'node-cache';

// Create cache instances with different TTL values
// Note: In Lambda, cache is only valid during warm starts
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

export default cache;
