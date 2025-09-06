import { type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

export const getOverallUserActivity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const activities = await prisma.activity.findMany({
            where: {
                userId
            },
            include: {
                user: {
                    select: {
                        username: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group activities by type for statistics
        const stats = activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate total points
        const totalPoints = activities.reduce((sum, activity) => sum + activity.points, 0);

        res.json({
            activities,
            statistics: {
                totalActivities: activities.length,
                typeBreakdown: stats,
                totalPoints
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getRecentUserActivity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const { limit = 10 } = req.query;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const recentActivities = await prisma.activity.findMany({
            where: {
                userId
            },
            include: {
                user: {
                    select: {
                        username: true,
                        image: true
                    }
                }
            },
            take: Number(limit),
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(recentActivities);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
