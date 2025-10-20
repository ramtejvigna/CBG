import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        
        if (!query || query.trim().length === 0) {
            return res.json({
                challenges: [],
                contests: [],
                users: []
            });
        }

        const searchTerm = query.trim().toLowerCase();

        // Search challenges
        const challenges = await prisma.challenge.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        category: {
                            name: {
                                contains: searchTerm,
                                mode: 'insensitive'
                            }
                        }
                    }
                ]
            },
            include: {
                category: {
                    select: {
                        name: true
                    }
                }
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Search contests
        const contests = await prisma.contest.findMany({
            where: {
                OR: [
                    {
                        title: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        tags: {
                            has: searchTerm
                        }
                    }
                ]
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Search users (warriors)
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        username: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    },
                    {
                        name: {
                            contains: searchTerm,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                name: true,
                image: true
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Add hasImage field to users
        const usersWithImageFlag = users.map((user: any) => ({
            ...user,
            hasImage: !!user.image
        }));

        res.json({
            challenges,
            contests,
            users: usersWithImageFlag
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};