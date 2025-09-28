import type { Request, Response } from 'express';
import { PrismaClient, Prisma, ContestStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const createContest = async (req: Request, res: Response) => {
    try {
        const { 
            title, 
            description, 
            startsAt, 
            endsAt, 
            registrationEnd,
            tags,
            points,               // <-- updated
            maxParticipants,
            challenges 
        } = req.body;

        // Validate that the user is authenticated and an admin
        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { adminLead: true }
        });

        if (!(user?.role === "ADMIN")) {
            return res.status(403).json({ message: 'Only admins can create contests' });
        }

        const contest = await prisma.contest.create({
            data: {
                title,
                description,
                startsAt: new Date(startsAt),
                endsAt: new Date(endsAt),
                registrationEnd: new Date(registrationEnd),
                points,
                maxParticipants,
                tags,
                status: ContestStatus.REGISTRATION_OPEN,
                creatorId: req.user.id,
                challenges: {
                    create: challenges.map((challenge: any, index: number) => ({
                        challengeId: challenge.id,
                        points: challenge.points,
                        order: index + 1
                    }))
                }
            },
            include: {
                challenges: {
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
        });

        res.status(201).json(contest);
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ message: 'Error creating contest' });
    }
};

export const registerForContest = async (req: Request, res: Response) => {
    try {
        const { contestId } = req.params;
        
        if (!contestId) {
            return res.status(400).json({ message: 'Contest ID is required' });
        }

        // Check if contest exists and is open for registration
        const contest = await prisma.contest.findUnique({
            where: { id: contestId }
        });

        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        if (contest.status !== ContestStatus.REGISTRATION_OPEN) {
            return res.status(400).json({ message: 'Contest registration is not open' });
        }

        if (contest.registrationEnd < new Date()) {
            return res.status(400).json({ message: 'Registration period has ended' });
        }

        // Check if max participants limit is reached
        if (contest.maxParticipants) {
            const participantCount = await prisma.contestParticipant.count({
                where: { contestId }
            });
            if (participantCount >= contest.maxParticipants) {
                return res.status(400).json({ message: 'Contest is full' });
            }
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Register the user
        const registration = await prisma.contestParticipant.create({
            data: {
                userId: req.user.id,
                contestId
            }
        });

        res.status(201).json(registration);
    } catch (error) {
        console.error('Error registering for contest:', error);
        res.status(500).json({ message: 'Error registering for contest' });
    }
};

export const getUpcomingContests = async (req: Request, res: Response) => {
    try {
        const contests = await prisma.contest.findMany({
            where: {
                status: {
                    in: [ContestStatus.UPCOMING, ContestStatus.REGISTRATION_OPEN]
                },
                endsAt: {
                    gt: new Date()
                }
            },
            include: {
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: {
                startsAt: 'asc'
            }
        });

        res.json(contests);
    } catch (error) {
        console.error('Error fetching upcoming contests:', error);
        res.status(500).json({ message: 'Error fetching contests' });
    }
};

export const getContestDetails = async (req: Request, res: Response) => {
    try {
        const { contestId } = req.params;
        
        if (!contestId) {
            return res.status(400).json({ message: 'Contest ID is required' });
        }

        // First get the contest status
        const contestStatus = await prisma.contest.findUnique({
            where: { id: contestId },
            select: { status: true }
        });

        if (!contestStatus) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        // Then fetch full contest details based on status
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            include: {
                _count: {
                    select: { participants: true }
                },
                participants: contestStatus.status === ContestStatus.FINISHED ? {
                    orderBy: {
                        points: 'desc'
                    },
                    take: 10,
                    include: {
                        user: {
                            select: {
                                username: true,
                                name: true,
                                image: true
                            }
                        }
                    }
                } : false,
                challenges: (contestStatus.status === ContestStatus.ONGOING || 
                           contestStatus.status === ContestStatus.FINISHED) ? {
                    include: {
                        challenge: {
                            select: {
                                title: true,
                                difficulty: true,
                                description: true
                            }
                        }
                    }
                } : false
            }
        });

        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        res.json(contest);
    } catch (error) {
        console.error('Error fetching contest details:', error);
        res.status(500).json({ message: 'Error fetching contest details' });
    }
};
