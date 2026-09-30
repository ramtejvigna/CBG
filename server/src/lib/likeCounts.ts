import prisma from './prisma.js';
import { REDIS_KEYS, redisMGet, redisSetMany, redisDel } from './redis.js';

/**
 * Like/dislike totals for a challenge.
 *
 * Reads are the hot path (every challenge page view), so they are served from Redis.
 * Postgres stays the source of truth: after any vote we recompute both totals in a
 * single grouped query and overwrite the cache, so the cache can never drift.
 */

const TTL_SECONDS = 600; // 10 minutes; a safety net if a write-through is ever missed

export interface LikeCounts {
    likes: number;
    dislikes: number;
}

/** Counts both sides in one query instead of two COUNT(*) round trips. */
async function countFromDatabase(challengeId: string): Promise<LikeCounts> {
    const grouped = await prisma.challengeLike.groupBy({
        by: ['isLike'],
        where: { challengeId },
        _count: { _all: true },
    });

    let likes = 0;
    let dislikes = 0;
    for (const row of grouped) {
        if (row.isLike) {
            likes = row._count._all;
        } else {
            dislikes = row._count._all;
        }
    }
    return { likes, dislikes };
}

async function writeToCache(challengeId: string, counts: LikeCounts): Promise<void> {
    await redisSetMany(
        [
            [REDIS_KEYS.challengeLikes(challengeId), String(counts.likes)],
            [REDIS_KEYS.challengeDislikes(challengeId), String(counts.dislikes)],
        ],
        TTL_SECONDS
    );
}

/** Cached read. Falls back to Postgres on a miss or if Redis is down. */
export async function getLikeCounts(challengeId: string): Promise<LikeCounts> {
    const [cachedLikes, cachedDislikes] = await redisMGet([
        REDIS_KEYS.challengeLikes(challengeId),
        REDIS_KEYS.challengeDislikes(challengeId),
    ]);

    if (cachedLikes !== null && cachedDislikes !== null) {
        const likes = Number(cachedLikes);
        const dislikes = Number(cachedDislikes);
        if (Number.isFinite(likes) && Number.isFinite(dislikes)) {
            return { likes, dislikes };
        }
    }

    const counts = await countFromDatabase(challengeId);
    await writeToCache(challengeId, counts);
    return counts;
}

/** Recomputes from Postgres and overwrites the cache. Call after any vote. */
export async function refreshLikeCounts(challengeId: string): Promise<LikeCounts> {
    const counts = await countFromDatabase(challengeId);
    await writeToCache(challengeId, counts);
    return counts;
}

/** Drops the cached totals, e.g. when a challenge is deleted. */
export async function invalidateLikeCounts(challengeId: string): Promise<void> {
    await redisDel(REDIS_KEYS.challengeLikes(challengeId), REDIS_KEYS.challengeDislikes(challengeId));
}
