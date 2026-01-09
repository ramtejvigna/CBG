import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getPlatformStatistics = async (req: Request, res: Response) => {
    try {
        // Fetch all statistics in parallel for better performance
        const [
            codingBattlesCount,
            activeWarriorsCount,
            problemSetCount,
            languagesCount
        ] = await Promise.all([
            // Count total contests (coding battles)
            prisma.contest.count(),
            
            // Count active users (users who have made submissions or participated)
            prisma.user.count({
                where: {
                    OR: [
                        { submissions: { some: {} } },
                        { contestParticipations: { some: {} } }
                    ]
                }
            }),
            
            // Count total challenges (problem set)
            prisma.challenge.count(),
            
            // Count total languages
            prisma.language.count()
        ]);

        res.json({
            codingBattles: codingBattlesCount,
            activeWarriors: activeWarriorsCount,
            problemSet: problemSetCount,
            languages: languagesCount
        });
    } catch (error) {
        console.error('Error fetching platform statistics:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
