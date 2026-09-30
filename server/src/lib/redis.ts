import { Redis } from 'ioredis';

/**
 * Redis is a cache, never the source of truth. Postgres holds the real data.
 * Every helper here fails soft: if Redis is unreachable the caller falls back to
 * the database, so a Redis outage degrades performance but never availability.
 */

const REDIS_URL = process.env.REDIS_URL;

let client: Redis | null = null;
let warnedUnavailable = false;

if (REDIS_URL) {
    client = new Redis(REDIS_URL, {
        // Don't queue commands forever while the connection is down - fail fast
        // so requests fall through to Postgres instead of hanging.
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: false,
        retryStrategy: (times: number) => Math.min(times * 200, 5000),
    });

    client.on('error', (err: Error) => {
        if (!warnedUnavailable) {
            console.warn('Redis unavailable, falling back to the database:', err.message);
            warnedUnavailable = true;
        }
    });

    client.on('ready', () => {
        warnedUnavailable = false;
        console.log('Redis connected');
    });
} else {
    console.warn('REDIS_URL is not set - caching falls back to the database');
}

export const isRedisReady = (): boolean => client?.status === 'ready';

/** Reads a key. Returns null on a miss or any Redis failure. */
export async function redisGet(key: string): Promise<string | null> {
    if (!isRedisReady()) return null;
    try {
        return await client!.get(key);
    } catch {
        return null;
    }
}

/** Reads several keys at once. Returns an all-null array on failure. */
export async function redisMGet(keys: string[]): Promise<(string | null)[]> {
    if (!isRedisReady() || keys.length === 0) return keys.map(() => null);
    try {
        return await client!.mget(...keys);
    } catch {
        return keys.map(() => null);
    }
}

/** Writes a key with a TTL in seconds. Never throws. */
export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!isRedisReady()) return;
    try {
        await client!.set(key, value, 'EX', ttlSeconds);
    } catch {
        // cache write failures are not fatal
    }
}

/** Writes several key/value pairs with the same TTL in one round trip. */
export async function redisSetMany(
    entries: [key: string, value: string][],
    ttlSeconds: number
): Promise<void> {
    if (!isRedisReady() || entries.length === 0) return;
    try {
        const pipeline = client!.pipeline();
        for (const [key, value] of entries) {
            pipeline.set(key, value, 'EX', ttlSeconds);
        }
        await pipeline.exec();
    } catch {
        // cache write failures are not fatal
    }
}

/** Deletes keys. Never throws. */
export async function redisDel(...keys: string[]): Promise<void> {
    if (!isRedisReady() || keys.length === 0) return;
    try {
        await client!.del(...keys);
    } catch {
        // cache delete failures are not fatal
    }
}

/** Reads and parses a JSON value. Returns null on a miss or malformed data. */
export async function redisGetJson<T>(key: string): Promise<T | null> {
    const raw = await redisGet(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function redisSetJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        await redisSet(key, JSON.stringify(value), ttlSeconds);
    } catch {
        // value was not serialisable; skip caching
    }
}

export async function closeRedis(): Promise<void> {
    if (!client) return;
    try {
        await client.quit();
    } catch {
        client.disconnect();
    }
}

export const REDIS_KEYS = {
    challengeLikes: (challengeId: string) => `challenge:${challengeId}:likes`,
    challengeDislikes: (challengeId: string) => `challenge:${challengeId}:dislikes`,
    session: (token: string) => `session:${token}`,
};

export default client;
