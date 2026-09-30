import prisma from './prisma.js';
import { REDIS_KEYS, redisGetJson, redisSetJson, redisDel } from './redis.js';

/**
 * Session lookups run on nearly every authenticated request, so they are cached.
 *
 * The cache lives in Redis rather than in process memory: with more than one API
 * instance a per-process cache means a logout, ban or role change on one instance
 * is invisible to the others until the entry expires. Every write path that ends a
 * session calls invalidate* below, so revocation takes effect immediately everywhere.
 */

const TTL_SECONDS = 300; // 5 minutes

export interface CachedSession {
    sessionToken: string;
    expires: string;
    user: {
        id: string;
        email: string;
        username: string;
        name: string | null;
        role: string;
        image: string | null;
        needsOnboarding: boolean;
    };
}

/**
 * Resolves a bearer token to its session, or null when the token is unknown or
 * the session has expired. Expired entries are evicted as a side effect.
 */
export async function getSessionByToken(token: string): Promise<CachedSession | null> {
    const key = REDIS_KEYS.session(token);

    const cached = await redisGetJson<CachedSession>(key);
    if (cached) {
        if (Date.now() <= new Date(cached.expires).getTime()) {
            return cached;
        }
        await redisDel(key);
        return null;
    }

    const session = await prisma.session.findUnique({
        where: { sessionToken: token },
        select: {
            sessionToken: true,
            expires: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    name: true,
                    role: true,
                    image: true,
                    needsOnboarding: true,
                },
            },
        },
    });

    if (!session || Date.now() > session.expires.getTime()) {
        return null;
    }

    const value: CachedSession = {
        sessionToken: session.sessionToken,
        expires: session.expires.toISOString(),
        user: session.user,
    };

    // Never cache past the session's own expiry
    const secondsLeft = Math.floor((session.expires.getTime() - Date.now()) / 1000);
    await redisSetJson(key, value, Math.min(TTL_SECONDS, Math.max(secondsLeft, 1)));

    return value;
}

/** Drops one token from the cache. Call on logout. */
export async function invalidateSession(token: string): Promise<void> {
    await redisDel(REDIS_KEYS.session(token));
}

/**
 * Drops every cached session for a user. Call when sessions are revoked in bulk
 * (password reset, ban, role change) so no instance keeps serving a stale identity.
 */
export async function invalidateSessionsForUser(userId: string): Promise<void> {
    const sessions = await prisma.session.findMany({
        where: { userId },
        select: { sessionToken: true },
    });
    if (sessions.length === 0) return;
    await redisDel(...sessions.map((s) => REDIS_KEYS.session(s.sessionToken)));
}
