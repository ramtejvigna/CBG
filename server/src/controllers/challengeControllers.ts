import type { Request, Response } from 'express';
import { Difficulty } from '@prisma/client';
import prisma from '../lib/prisma.js';

export const getChallengeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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

export const getChallengesByFilter = async (req: Request, res: Response) => {
    try {
        const { category, difficulty } = req.query;
        
        const challenges = await prisma.challenge.findMany({
            where: {
                categoryId: category as string,
                difficulty: difficulty as Difficulty,
            },
            include: {
                creator: {
                    select: {
                        username: true,
                        image: true
                    }
                },
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
        
        if (!id) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                challengeId: id
            },
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

        res.json(submissions);
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

        if(req.user?.id) {
            return res.status(400).json({
                message: 'Unauthorized Access'
            })
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
                creatorId: req.user?.id, // Assuming req.user is set by auth middleware
                languages: {
                    connect: languageIds.map((id: string) => ({ id }))
                },
                testCases: {
                    create: testCases
                }
            },
            include: {
                languages: true,
                testCases: true,
                category: true
            }
        });

        res.status(201).json(challenge);
    } catch (error) {
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

        // First check if challenge exists and if user is the creator
        const existingChallenge = await prisma.challenge.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        if (!existingChallenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (existingChallenge.creatorId !== req.user?.id) { // Assuming req.user is set by auth middleware
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
                languages: {
                    set: languageIds.map((id: string) => ({ id }))
                },
                testCases: {
                    deleteMany: {},
                    create: testCases
                }
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
