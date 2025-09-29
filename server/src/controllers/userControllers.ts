import { type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';

export const getUserSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                userId
            },
            include: {
                challenge: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        points: true
                    }
                },
                language: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserSubmissionsByUsername = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 20, status, difficulty } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {
            userId: user.id
        };

        if (status) {
            where.status = status;
        }

        if (difficulty) {
            where.challenge = {
                difficulty: difficulty
            };
        }

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                challenge: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        points: true
                    }
                },
                language: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitNum
        });

        const totalSubmissions = await prisma.submission.count({
            where
        });

        res.json({
            submissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalSubmissions,
                pages: Math.ceil(totalSubmissions / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userProfile: {
                    include: {
                        badges: true,
                        languages: true
                    }
                },
                submissions: {
                    select: {
                        id: true,
                        status: true,
                        challenge: {
                            select: {
                                id: true,
                                title: true,
                                difficulty: true
                            }
                        }
                    },
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        submissions: true,
                        challengeAttempts: true,
                        challengeLikes: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove sensitive information
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                userProfile: {
                    include: {
                        badges: {
                            orderBy: {
                                createdAt: 'desc'
                            }
                        },
                        languages: {
                            orderBy: {
                                percentage: 'desc'
                            }
                        }
                    }
                },
                activites: {
                    take: 10,
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        submissions: true,
                        challengeAttempts: true,
                        challengeLikes: true,
                        contestParticipations: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate statistics
        const totalSubmissions = await prisma.submission.count({
            where: { userId: user.id }
        });

        const acceptedSubmissions = await prisma.submission.count({
            where: {
                userId: user.id,
                status: 'ACCEPTED'
            }
        });

        const contestParticipations = await prisma.contestParticipant.count({
            where: { userId: user.id }
        });

        // Calculate points breakdown from accepted submissions
        const acceptedSubmissionsWithChallenges = await prisma.submission.findMany({
            where: {
                userId: user.id,
                status: 'ACCEPTED'
            },
            include: {
                challenge: {
                    select: {
                        points: true
                    }
                }
            },
            distinct: ['challengeId'] // Only count each challenge once
        });

        const challengePoints = acceptedSubmissionsWithChallenges.reduce(
            (sum, submission) => sum + submission.challenge.points, 
            0
        );

        // Calculate contest points
        const contestPoints = await prisma.contestParticipant.aggregate({
            where: { userId: user.id },
            _sum: {
                points: true
            }
        });

        const pointsBreakdown = {
            challenges: challengePoints,
            contests: contestPoints._sum.points || 0,
            badges: user.userProfile?.badges.reduce((sum, badge) => sum + badge.points, 0) || 0,
            discussions: 0 // Future implementation
        };

        // Remove sensitive information
        const { password, ...userWithoutPassword } = user;
        
        res.json({
            ...userWithoutPassword,
            stats: {
                totalSubmissions,
                acceptedSubmissions,
                contestParticipations,
                successRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0
            },
            pointsBreakdown
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Check if user is admin
        // if (req.user?.role !== 'ADMIN') {
        //     return res.status(403).json({ message: 'Not authorized' });
        // }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                image: true,
                role: true,
                userProfile: {
                    select: {
                        rank: true,
                        solved: true,
                        level: true,
                        points: true
                    }
                },
                _count: {
                    select: {
                        submissions: true,
                        challengeAttempts: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const topUsers = await prisma.userProfile.findMany({
            take: 10,
            where: { user: { role: 'USER' } },
            select: {
                points: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        image: true
                    }
                }
            },
            orderBy: [
                { points: 'desc' },
                { solved: 'desc' }
            ]
        });

        res.json(topUsers);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserActivity = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const activities = await prisma.activity.findMany({
            where: { userId: user.id },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitNum
        });

        const totalActivities = await prisma.activity.count({
            where: { userId: user.id }
        });

        res.json({
            activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalActivities,
                pages: Math.ceil(totalActivities / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserContests = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        const contestParticipations = await prisma.contestParticipant.findMany({
            where: { userId: user.id },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        startsAt: true,
                        endsAt: true,
                        status: true,
                        points: true
                    }
                },
                submissions: {
                    include: {
                        contestChallenge: {
                            include: {
                                challenge: {
                                    select: {
                                        title: true,
                                        difficulty: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            },
            skip: offset,
            take: limitNum
        });

        const totalContests = await prisma.contestParticipant.count({
            where: { userId: user.id }
        });

        res.json({
            contests: contestParticipations,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalContests,
                pages: Math.ceil(totalContests / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching user contests:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
