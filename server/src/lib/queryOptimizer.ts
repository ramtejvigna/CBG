import prisma from './prisma.js';

// Common query optimizations
export const getUserBasicSelect = {
    id: true,
    username: true,
    image: true,
    name: true,
    role: true
};

export const getChallengeBasicSelect = {
    id: true,
    title: true,
    difficulty: true,
    points: true,
    description: true,
    createdAt: true
};

export const getSubmissionBasicSelect = {
    id: true,
    status: true,
    runtime: true,
    memory: true,
    createdAt: true
};

// Optimized bulk queries
export const bulkQueries = {
    // Get multiple users by IDs with basic info
    getUsersByIds: async (userIds: string[]) => {
        return prisma.user.findMany({
            where: {
                id: { in: userIds }
            },
            select: getUserBasicSelect
        });
    },

    // Get multiple challenges by IDs with basic info
    getChallengesByIds: async (challengeIds: string[]) => {
        return prisma.challenge.findMany({
            where: {
                id: { in: challengeIds }
            },
            select: getChallengeBasicSelect
        });
    },

    // Get user submission counts efficiently
    getUserSubmissionStats: async (userId: string) => {
        const [total, accepted] = await Promise.all([
            prisma.submission.count({
                where: { userId }
            }),
            prisma.submission.count({
                where: {
                    userId,
                    status: 'ACCEPTED'
                }
            })
        ]);

        return {
            total,
            accepted,
            successRate: total > 0 ? Math.round((accepted / total) * 100) : 0
        };
    },

    // Get paginated submissions with minimal data
    getPaginatedSubmissions: async (userId: string, page: number, limit: number) => {
        const offset = (page - 1) * limit;
        
        const [submissions, total] = await Promise.all([
            prisma.submission.findMany({
                where: { userId },
                select: {
                    ...getSubmissionBasicSelect,
                    challenge: {
                        select: getChallengeBasicSelect
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma.submission.count({
                where: { userId }
            })
        ]);

        return {
            submissions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
};

export default bulkQueries;