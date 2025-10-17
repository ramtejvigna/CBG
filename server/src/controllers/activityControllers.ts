import { type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

export const getOverallUserActivity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const { 
            page = 1, 
            limit = 10, 
            type,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string))); // Max 50 items per page
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause: any = { userId };
        if (type && type !== 'all') {
            whereClause.type = type;
        }

        // Get total count for pagination
        const totalCount = await prisma.activity.count({
            where: whereClause
        });

        // Get paginated activities
        const activities = await prisma.activity.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        image: true
                    }
                }
            },
            orderBy: {
                [sortBy as string]: sortOrder
            },
            skip,
            take: limitNum
        });

        // Get overall statistics (not paginated)
        const allActivities = await prisma.activity.findMany({
            where: { userId },
            select: {
                type: true,
                points: true
            }
        });

        // Group activities by type for statistics
        const stats = allActivities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate total points
        const totalPoints = allActivities.reduce((sum, activity) => sum + activity.points, 0);

        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.json({
            activities,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limitNum,
                hasNextPage,
                hasPrevPage
            },
            statistics: {
                totalActivities: allActivities.length,
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
