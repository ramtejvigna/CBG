import { type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';
import { cache } from '../lib/cache.js';

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

        // Cache key for user activity
        const cacheKey = `user_activity_overall_${userId}_${pageNum}_${limitNum}_${type}_${sortBy}_${sortOrder}`;
        
        // Check cache first (cache for 3 minutes)
        const cachedActivity = cache.get(cacheKey);
        if (cachedActivity) {
            return res.json(cachedActivity);
        }

        console.log(`Fetching user activity from database for user ${userId}`);
        const startTime = Date.now();

        // Build where clause
        const whereClause: any = { userId };
        if (type && type !== 'all') {
            whereClause.type = type;
        }

        // Run queries in parallel for better performance
        const [totalCount, activities, statsData] = await Promise.all([
            // Get total count for pagination
            prisma.activity.count({
                where: whereClause
            }),

            // Get paginated activities
            prisma.activity.findMany({
                where: whereClause,
                select: {
                    id: true,
                    type: true,
                    name: true,
                    result: true,
                    points: true,
                    createdAt: true
                },
                orderBy: {
                    [sortBy as string]: sortOrder
                },
                skip,
                take: limitNum
            }),

            // Get statistics data (aggregated)
            prisma.activity.groupBy({
                by: ['type'],
                where: { userId },
                _count: {
                    type: true
                },
                _sum: {
                    points: true
                }
            })
        ]);

        // Process grouped statistics
        const stats = statsData.reduce((acc: Record<string, number>, group: any) => {
            acc[group.type] = group._count.type;
            return acc;
        }, {});

        // Calculate total points from grouped data
        const totalPoints = statsData.reduce((sum: number, group: any) => sum + (group._sum.points || 0), 0);
        const totalActivities = statsData.reduce((sum: number, group: any) => sum + group._count.type, 0);

        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const queryTime = Date.now() - startTime;
        console.log(`User activity query completed in ${queryTime}ms`);

        const activityData = {
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
                totalActivities,
                typeBreakdown: stats,
                totalPoints
            }
        };

        // Cache the activity data for 3 minutes
        cache.setShort(cacheKey, activityData);

        res.json(activityData);
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
