import type { Request, Response } from 'express';
import { Difficulty } from '@prisma/client';
import prisma from '../lib/prisma.js';

export const getChallengeBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        
        if (!slug) {
            return res.status(400).json({ message: 'Challenge slug is required' });
        }

        // Generate a search pattern for the slug
        // Convert slug back to potential title variations for search
        const searchTitle = slug
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Find challenges that match the slug pattern
        const challenges = await prisma.challenge.findMany({
            where: {
                title: {
                    contains: searchTitle,
                    mode: 'insensitive'
                }
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        image: true
                    }
                },
                languages: true,
                testCases: {
                    where: { isHidden: false },
                    select: {
                        id: true,
                        input: true,
                        output: true,
                        explanation: true
                    }
                },
                category: true,
                _count: {
                    select: {
                        submissions: true,
                        likes: true
                    }
                }
            }
        });

        // Find the best match by generating slug for each challenge
        const bestMatch = challenges.find(challenge => {
            const challengeSlug = challenge.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            return challengeSlug === slug;
        });

        if (!bestMatch) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.json(bestMatch);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getChallengeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }
        
        const challenge = await prisma.challenge.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        image: true
                    }
                },
                languages: true,
                testCases: {
                    where: { isHidden: false },
                    select: {
                        id: true,
                        input: true,
                        output: true,
                        explanation: true
                    }
                },
                category: true,
                _count: {
                    select: {
                        submissions: true,
                        likes: true
                    }
                }
            }
        });

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.json(challenge);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getHomePageChallenges = async (req: Request, res: Response) => {
    try {
        const challenges = await prisma.challenge.findMany({
            take: 4,
            include: {
                creator: {
                    select: {
                        username: true,
                        image: true
                    }
                },
                languages: true,
                category: true,
                _count: {
                    select: {
                        submissions: true,
                        likes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(challenges);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getChallengesByFilter = async (req: Request, res: Response) => {
    try {
        const { category, difficulty } = req.query;
        
        const whereClause: any = {};
        
        if (category) {
            whereClause.categoryId = category as string;
        }
        
        if (difficulty) {
            whereClause.difficulty = difficulty as Difficulty;
        }

        const challenges = await prisma.challenge.findMany({
            where: whereClause,
            include: {
                creator: {
                    select: {
                        username: true,
                        image: true
                    }
                },
                languages: true,
                category: true,
                _count: {
                    select: {
                        submissions: true,
                        likes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(challenges);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getChallengeSubmissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId, challengeId } = req.query;
        
        // Get challengeId from either params or query
        const targetChallengeId = id || (challengeId as string);
        
        if (!targetChallengeId) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        const whereClause: any = {
            challengeId: targetChallengeId
        };

        // If userId is provided, filter by user
        if (userId) {
            whereClause.userId = userId as string;
        }

        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        image: true
                    }
                },
                language: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ success: true, submissions });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const createChallenge = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            difficulty,
            points,
            categoryId,
            languageIds,
            testCases,
            timeLimit,
            memoryLimit,
            challengeType
        } = req.body;

        if (!req.user?.id) {
            return res.status(401).json({
                message: 'Unauthorized Access'
            });
        }

        // Validate required fields
        if (!title || !description || !difficulty || !categoryId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const challenge = await prisma.challenge.create({
            data: {
                title,
                description,
                difficulty,
                points,
                categoryId,
                timeLimit,
                memoryLimit,
                challengeType,
                creatorId: req.user.id, // Type-safe after validation
                languages: {
                    connect: languageIds?.map((id: string) => ({ id })) || []
                },
                testCases: {
                    create: testCases || []
                }
            },
            include: {
                languages: true,
                testCases: true,
                category: true
            }
        });

        res.status(201).json({
            success: true,
            message: "Successfully created a challenge"
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateChallenge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            difficulty,
            points,
            categoryId,
            languageIds,
            testCases,
            timeLimit,
            memoryLimit,
            challengeType
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: 'Unauthorized Access' });
        }

        // First check if challenge exists and if user is the creator
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        if (!existingChallenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (existingChallenge.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this challenge' });
        }

        // Update the challenge
        const challenge = await prisma.challenge.update({
            where: { id },
            data: {
                title,
                description,
                difficulty,
                points,
                categoryId,
                timeLimit,
                memoryLimit,
                challengeType,
                ...(languageIds && {
                    languages: {
                        set: languageIds.map((id: string) => ({ id }))
                    }
                }),
                ...(testCases && {
                    testCases: {
                        deleteMany: {},
                        create: testCases
                    }
                })
            },
            include: {
                languages: true,
                testCases: true,
                category: true
            }
        });

        res.json(challenge);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
