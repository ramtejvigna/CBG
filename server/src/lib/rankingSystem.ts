import prisma from './prisma.js';

export class RankingSystem {
    /**
     * Update ranks for all users efficiently using SQL window functions
     * This is the most efficient way to calculate ranks for all users
     */
    static async updateAllUserRanks(): Promise<void> {
        try {
            console.log('Starting full rank update...');
            const startTime = Date.now();

            // Use raw SQL for efficient ranking calculation
            // ROW_NUMBER() is much more efficient than application-level ranking
            await prisma.$executeRaw`
                UPDATE "UserProfile" 
                SET rank = ranked_profiles.new_rank
                FROM (
                    SELECT 
                        id,
                        ROW_NUMBER() OVER (
                            ORDER BY points DESC, solved DESC, "createdAt" ASC
                        ) as new_rank
                    FROM "UserProfile"
                    WHERE "userId" IN (
                        SELECT id FROM "User" WHERE role = 'USER'
                    )
                ) ranked_profiles
                WHERE "UserProfile".id = ranked_profiles.id
            `;

            const endTime = Date.now();
            console.log(`Full rank update completed in ${endTime - startTime}ms`);
        } catch (error) {
            console.error('Error updating all user ranks:', error);
            throw error;
        }
    }

    /**
     * Update rank for a specific user and nearby users
     * This is more efficient for single user updates
     */
    static async updateUserRank(userId: string): Promise<number | null> {
        try {
            // Get user's current profile
            const userProfile = await prisma.userProfile.findUnique({
                where: { userId },
                select: { id: true, points: true, solved: true, rank: true }
            });

            if (!userProfile) {
                console.log(`No profile found for user ${userId}`);
                return null;
            }

            // Calculate the user's new rank efficiently
            const rankResult = await prisma.$queryRaw<[{ rank: bigint }]>`
                SELECT COUNT(*) + 1 as rank
                FROM "UserProfile" up
                JOIN "User" u ON up."userId" = u.id
                WHERE u.role = 'USER'
                AND (
                    up.points > ${userProfile.points}
                    OR (
                        up.points = ${userProfile.points} 
                        AND up.solved > ${userProfile.solved}
                    )
                    OR (
                        up.points = ${userProfile.points} 
                        AND up.solved = ${userProfile.solved}
                        AND up."createdAt" < (
                            SELECT "createdAt" FROM "UserProfile" WHERE id = ${userProfile.id}
                        )
                    )
                )
            `;

            const newRank = Number(rankResult[0].rank);

            // Update the user's rank
            await prisma.userProfile.update({
                where: { id: userProfile.id },
                data: { rank: newRank }
            });

            console.log(`Updated rank for user ${userId}: ${newRank}`);
            return newRank;
        } catch (error) {
            console.error(`Error updating rank for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update ranks for users within a certain range
     * Useful when multiple users' points change simultaneously
     */
    static async updateRanksInRange(minPoints: number, maxPoints: number): Promise<void> {
        try {
            console.log(`Updating ranks for users with points between ${minPoints} and ${maxPoints}`);

            await prisma.$executeRaw`
                UPDATE "UserProfile" 
                SET rank = ranked_profiles.new_rank
                FROM (
                    SELECT 
                        id,
                        ROW_NUMBER() OVER (
                            ORDER BY points DESC, solved DESC, "createdAt" ASC
                        ) as new_rank
                    FROM "UserProfile"
                    WHERE "userId" IN (
                        SELECT id FROM "User" WHERE role = 'USER'
                    )
                    AND points BETWEEN ${minPoints} AND ${maxPoints + 1000}
                ) ranked_profiles
                WHERE "UserProfile".id = ranked_profiles.id
                AND "UserProfile".points BETWEEN ${minPoints} AND ${maxPoints + 1000}
            `;

            console.log('Range rank update completed');
        } catch (error) {
            console.error('Error updating ranks in range:', error);
            throw error;
        }
    }

    /**
     * Get leaderboard with accurate ranks
     */
    static async getLeaderboard(limit: number = 10, offset: number = 0) {
        try {
            const leaderboard = await prisma.userProfile.findMany({
                where: { 
                    user: { role: 'USER' },
                    rank: { not: null }
                },
                select: {
                    rank: true,
                    points: true,
                    solved: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            image: true
                        }
                    }
                },
                orderBy: { rank: 'asc' },
                take: limit,
                skip: offset
            });

            return leaderboard;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    /**
     * Get user's current rank and position information
     */
    static async getUserRankInfo(userId: string) {
        try {
            const userProfile = await prisma.userProfile.findUnique({
                where: { userId },
                select: {
                    rank: true,
                    points: true,
                    solved: true,
                    user: {
                        select: {
                            username: true,
                            image: true
                        }
                    }
                }
            });

            if (!userProfile || !userProfile.rank) {
                return null;
            }

            // Get total number of ranked users
            const totalUsers = await prisma.userProfile.count({
                where: { 
                    user: { role: 'USER' },
                    rank: { not: null }
                }
            });

            // Get users around this user's rank
            const nearbyUsers = await this.getLeaderboard(5, Math.max(0, userProfile.rank - 3));

            return {
                ...userProfile,
                totalUsers,
                nearbyUsers,
                percentile: Math.round((1 - (userProfile.rank - 1) / totalUsers) * 100)
            };
        } catch (error) {
            console.error(`Error getting rank info for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Check if full rank recalculation is needed
     * This can be called periodically or when many users' points change
     */
    static async isFullRankUpdateNeeded(): Promise<boolean> {
        try {
            // Check if there are users without ranks
            const usersWithoutRanks = await prisma.userProfile.count({
                where: { 
                    user: { role: 'USER' },
                    rank: null
                }
            });

            // Check if ranks are inconsistent (this is a simple check)
            const topUserByPoints = await prisma.userProfile.findFirst({
                where: { user: { role: 'USER' } },
                orderBy: [
                    { points: 'desc' },
                    { solved: 'desc' },
                    { createdAt: 'asc' }
                ],
                select: { rank: true }
            });

            const topUserByRank = await prisma.userProfile.findFirst({
                where: { 
                    user: { role: 'USER' },
                    rank: { not: null }
                },
                orderBy: { rank: 'asc' },
                select: { rank: true }
            });

            // If top user by points doesn't have rank 1, or if there are users without ranks
            const needsUpdate = usersWithoutRanks > 0 || 
                               (topUserByPoints?.rank !== 1) || 
                               (topUserByRank?.rank !== 1);

            if (needsUpdate) {
                console.log(`Full rank update needed: ${usersWithoutRanks} users without ranks`);
            }

            return needsUpdate;
        } catch (error) {
            console.error('Error checking if full rank update is needed:', error);
            return true; // Default to needing update if there's an error
        }
    }

    /**
     * Batch update ranks after multiple point changes
     * More efficient than updating individual ranks
     */
    static async batchUpdateRanks(userIds: string[]): Promise<void> {
        try {
            if (userIds.length === 0) return;

            console.log(`Batch updating ranks for ${userIds.length} users`);

            // Get points range for affected users
            const pointsRange = await prisma.userProfile.aggregate({
                where: { userId: { in: userIds } },
                _min: { points: true },
                _max: { points: true }
            });

            if (pointsRange._min.points !== null && pointsRange._max.points !== null) {
                // Update ranks for users in the affected range
                await this.updateRanksInRange(
                    Math.max(0, pointsRange._min.points - 100), 
                    pointsRange._max.points + 100
                );
            } else {
                // Fallback to full update if we can't determine range
                await this.updateAllUserRanks();
            }
        } catch (error) {
            console.error('Error in batch rank update:', error);
            throw error;
        }
    }
}

// Utility functions for easier access
export const updateAllUserRanks = () => RankingSystem.updateAllUserRanks();
export const updateUserRank = (userId: string) => RankingSystem.updateUserRank(userId);
export const getLeaderboard = (limit?: number, offset?: number) => RankingSystem.getLeaderboard(limit, offset);
export const getUserRankInfo = (userId: string) => RankingSystem.getUserRankInfo(userId);
export const batchUpdateRanks = (userIds: string[]) => RankingSystem.batchUpdateRanks(userIds);