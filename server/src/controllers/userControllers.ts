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
