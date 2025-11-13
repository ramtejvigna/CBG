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

        // Get likes and dislikes count in parallel
        const [likesCount, dislikesCount] = await Promise.all([
            prisma.challengeLike.count({
                where: {
                    challengeId: bestMatch.id,
                    isLike: true
                }
            }),
            prisma.challengeLike.count({
                where: {
                    challengeId: bestMatch.id,
                    isLike: false
                }
            })
        ]);

        // Add the proper counts to the response
        const responseData = {
            ...bestMatch,
            likes: likesCount,
            dislikes: dislikesCount,
            _count: {
                ...bestMatch._count,
                likes: likesCount
            }
        };

        res.json(responseData);
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

        // Get likes and dislikes count in parallel
        const [likesCount, dislikesCount] = await Promise.all([
            prisma.challengeLike.count({
                where: {
                    challengeId: challenge.id,
                    isLike: true
                }
            }),
            prisma.challengeLike.count({
                where: {
                    challengeId: challenge.id,
                    isLike: false
                }
            })
        ]);

        // Add the proper counts to the response
        const responseData = {
            ...challenge,
            likes: likesCount,
            dislikes: dislikesCount,
            _count: {
                ...challenge._count,
                likes: likesCount
            }
        };

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getHomePageChallenges = async (req: Request, res: Response) => {
    try {
        const challenges = await prisma.challenge.findMany({
            take: 4,
            select: {
                id: true,
                title: true,
                difficulty: true,
                points: true,
                description: true,
                createdAt: true,
                _count: {
                    select: {
                        submissions: true
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

export const likeChallengeToggle = async (req: Request, res: Response) => {
    try {
        const { id: challengeId } = req.params;
        const { isLike } = req.body;
        
        if (!challengeId) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.user.id;

        // Check if challenge exists
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            select: { id: true }
        });

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Check if user has already liked/disliked this challenge
        const existingLike = await prisma.challengeLike.findUnique({
            where: {
                userId_challengeId: {
                    userId,
                    challengeId
                }
            }
        });

        if (existingLike) {
            if (existingLike.isLike === isLike) {
                // User is clicking the same action, so remove the like/dislike
                await prisma.challengeLike.delete({
                    where: {
                        userId_challengeId: {
                            userId,
                            challengeId
                        }
                    }
                });
            } else {
                // User is switching from like to dislike or vice versa
                await prisma.challengeLike.update({
                    where: {
                        userId_challengeId: {
                            userId,
                            challengeId
                        }
                    },
                    data: {
                        isLike
                    }
                });
            }
        } else {
            // User hasn't liked/disliked this challenge yet, create new record
            await prisma.challengeLike.create({
                data: {
                    userId,
                    challengeId,
                    isLike
                }
            });
        }

        // Get updated counts
        const likesCount = await prisma.challengeLike.count({
            where: {
                challengeId,
                isLike: true
            }
        });

        const dislikesCount = await prisma.challengeLike.count({
            where: {
                challengeId,
                isLike: false
            }
        });

        // Get current user's like status
        const userLikeStatus = await prisma.challengeLike.findUnique({
            where: {
                userId_challengeId: {
                    userId,
                    challengeId
                }
            },
            select: {
                isLike: true
            }
        });

        res.json({
            success: true,
            likes: likesCount,
            dislikes: dislikesCount,
            userLikeStatus: userLikeStatus?.isLike ?? null
        });
    } catch (error) {
        console.error('Error toggling challenge like:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getChallengeStats = async (req: Request, res: Response) => {
    try {
        const { id: challengeId } = req.params;
        const userId = req.user?.id;
        
        if (!challengeId) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        // Get like/dislike counts
        const likesCount = await prisma.challengeLike.count({
            where: {
                challengeId,
                isLike: true
            }
        });

        const dislikesCount = await prisma.challengeLike.count({
            where: {
                challengeId,
                isLike: false
            }
        });

        // Get current user's like status if authenticated
        let userLikeStatus = null;
        if (userId) {
            const userLike = await prisma.challengeLike.findUnique({
                where: {
                    userId_challengeId: {
                        userId,
                        challengeId
                    }
                },
                select: {
                    isLike: true
                }
            });
            userLikeStatus = userLike?.isLike ?? null;
        }

        res.json({
            success: true,
            likes: likesCount,
            dislikes: dislikesCount,
            userLikeStatus
        });
    } catch (error) {
        console.error('Error fetching challenge stats:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
