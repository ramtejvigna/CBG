import type { Request, Response } from 'express';
import { PrismaClient, Prisma, ContestStatus, SubmissionStatus, ActivityType } from '@prisma/client';
import { dockerExecutor } from '../lib/dockerExecutor.js';
import { updateUserRank } from '../lib/rankingSystem.js';

const prisma = new PrismaClient();

export const submitToContest = async (req: Request, res: Response) => {
    try {
        const { contestId, challengeId, code, language } = req.body;
        
        if (!contestId || !challengeId || !code || !language) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: contestId, challengeId, code, language' 
            });
        }

        if (!req.user?.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Check if contest is ongoing
        const contest = await prisma.contest.findUnique({
            where: { id: contestId },
            select: { status: true, startsAt: true, endsAt: true }
        });

        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        if (contest.status !== ContestStatus.ONGOING) {
            return res.status(400).json({ message: 'Contest is not currently ongoing' });
        }

        const now = new Date();
        if (now < contest.startsAt || now > contest.endsAt) {
            return res.status(400).json({ message: 'Contest is not active' });
        }

        // Check if user is registered for the contest
        const participant = await prisma.contestParticipant.findUnique({
            where: {
                userId_contestId: {
                    userId: req.user.id,
                    contestId: contestId
                }
            }
        });

        if (!participant) {
            return res.status(400).json({ message: 'User is not registered for this contest' });
        }

        // Get contest challenge details
        const contestChallenge = await prisma.contestChallenge.findUnique({
            where: {
                contestId_challengeId: {
                    contestId: contestId,
                    challengeId: challengeId
                }
            },
            include: {
                challenge: {
                    include: {
                        testCases: true,
                        languages: true
                    }
                }
            }
        });

        if (!contestChallenge) {
            return res.status(404).json({ message: 'Challenge not found in this contest' });
        }

        const { challenge } = contestChallenge;

        // Find language
        const challengeLanguage = challenge.languages.find(
            lang => lang.name.toLowerCase() === language.toLowerCase()
        );

        if (!challengeLanguage) {
            return res.status(400).json({ 
                success: false, 
                message: `Language ${language} is not supported for this challenge` 
            });
        }

        // Execute code against all test cases
        const testCases = challenge.testCases;
        
        if (testCases.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No test cases available' 
            });
        }

        // Execute code in Docker containers for each test case
        const testResults = await Promise.all(testCases.map(async (testCase) => {
            try {
                const executionResult = await dockerExecutor.execute(
                    code,
                    language,
                    testCase.input,
                    testCase.output,
                    challenge.timeLimit,
                    challenge.memoryLimit
                );
                
                return {
                    input: testCase.input,
                    expectedOutput: testCase.output,
                    actualOutput: executionResult.output,
                    passed: executionResult.passed || false,
                    runtime: executionResult.runtime || 0,
                    memory: executionResult.memory || 0,
                    error: executionResult.error,
                    status: executionResult.status,
                    testCaseId: testCase.id
                };
            } catch (error) {
                console.error(`Error executing test case ${testCase.id}:`, error);
                return {
                    input: testCase.input,
                    expectedOutput: testCase.output,
                    actualOutput: '',
                    passed: false,
                    runtime: 0,
                    memory: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: SubmissionStatus.RUNTIME_ERROR,
                    testCaseId: testCase.id
                };
            }
        }));

        // Calculate overall results
        const passedTests = testResults.filter(result => result.passed).length;
        const totalTests = testResults.length;
        const allPassed = passedTests === totalTests;
        const avgRuntime = Math.round(testResults.reduce((sum, result) => sum + (result.runtime || 0), 0) / testResults.length);
        const avgMemory = Math.round(testResults.reduce((sum, result) => sum + (result.memory || 0), 0) / testResults.length);
        
        // Determine overall status
        let overallStatus: SubmissionStatus = SubmissionStatus.ACCEPTED;
        
        if (!allPassed) {
            const failedResults = testResults.filter(result => !result.passed);
            if (failedResults.some(r => r.status === SubmissionStatus.COMPILATION_ERROR)) {
                overallStatus = SubmissionStatus.COMPILATION_ERROR;
            } else if (failedResults.some(r => r.status === SubmissionStatus.RUNTIME_ERROR)) {
                overallStatus = SubmissionStatus.RUNTIME_ERROR;
            } else if (failedResults.some(r => r.status === SubmissionStatus.MEMORY_LIMIT_EXCEEDED)) {
                overallStatus = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
            } else if (failedResults.some(r => r.status === SubmissionStatus.TIME_LIMIT_EXCEEDED)) {
                overallStatus = SubmissionStatus.TIME_LIMIT_EXCEEDED;
            } else {
                overallStatus = SubmissionStatus.WRONG_ANSWER;
            }
        }

        // Calculate points for contest submission
        const submissionPoints = allPassed ? contestChallenge.points : 0;

        try {
            // Use transaction to ensure data consistency
            const submission = await prisma.$transaction(async (tx) => {
                // Create or update contest submission
                const contestSubmission = await tx.contestSubmission.upsert({
                    where: {
                        participantId_contestChallengeId: {
                            participantId: participant.id,
                            contestChallengeId: contestChallenge.id
                        }
                    },
                    update: {
                        code: code,
                        languageId: challengeLanguage.id,
                        status: overallStatus,
                        points: submissionPoints,
                        runtime: avgRuntime,
                        memory: avgMemory,
                        testResults: testResults
                    },
                    create: {
                        participantId: participant.id,
                        contestChallengeId: contestChallenge.id,
                        code: code,
                        languageId: challengeLanguage.id,
                        status: overallStatus,
                        points: submissionPoints,
                        runtime: avgRuntime,
                        memory: avgMemory,
                        testResults: testResults
                    }
                });

                // If this is a successful submission, update participant points
                if (overallStatus === SubmissionStatus.ACCEPTED) {
                    // Check if this is the participant's first successful submission for this challenge
                    const existingSuccessfulSubmission = await tx.contestSubmission.findFirst({
                        where: {
                            participantId: participant.id,
                            contestChallengeId: contestChallenge.id,
                            status: SubmissionStatus.ACCEPTED,
                            id: { not: contestSubmission.id }
                        }
                    });

                    // Only update points if this is the first successful submission or if it's better
                    if (!existingSuccessfulSubmission) {
                        // Update participant points
                        await tx.contestParticipant.update({
                            where: { id: participant.id },
                            data: {
                                points: {
                                    increment: submissionPoints
                                }
                            }
                        });

                        // Update user profile points and create activity
                        await tx.userProfile.upsert({
                            where: { userId: req.user!.id },
                            update: {
                                points: {
                                    increment: submissionPoints
                                }
                            },
                            create: {
                                userId: req.user!.id,
                                rank: null,
                                bio: "No bio provided",
                                phone: null,
                                solved: 0,
                                preferredLanguage: "javascript",
                                level: 1,
                                points: submissionPoints,
                                streakDays: 0
                            }
                        });

                        // Create activity record
                        await tx.activity.create({
                            data: {
                                userId: req.user!.id,
                                type: ActivityType.CONTEST,
                                name: `Contest Submission: ${challenge.title}`,
                                result: `Successfully solved contest challenge`,
                                points: submissionPoints,
                                time: new Date().toLocaleTimeString()
                            }
                        });

                        // Update user rank after points change
                        try {
                            await updateUserRank(req.user!.id);
                            console.log(`Updated rank for user ${req.user!.id} after contest submission`);
                        } catch (rankError) {
                            console.error('Error updating user rank after contest submission:', rankError);
                            // Don't fail the submission if rank update fails
                        }
                    }
                }

                return contestSubmission;
            });

            res.json({
                success: true,
                submission,
                testResults,
                runtime: avgRuntime,
                memory: avgMemory,
                allPassed,
                passedTests,
                totalTests,
                status: overallStatus,
                points: submissionPoints
            });

        } catch (dbError) {
            console.error('Error saving contest submission:', dbError);
            res.status(500).json({ 
                success: false, 
                message: 'Error saving submission' 
            });
        }

    } catch (error) {
        console.error('Error in contest submission:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error'
        });
    }
};

export const createContest = async (req: Request, res: Response) => {
    try {
        const { 
            title, 
            description, 
            startsAt, 
            endsAt, 
            registrationEnd,
            tags,
            points,
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

export const getContests = async (req: Request, res: Response) => {
    try {
        const contests = await prisma.contest.findMany({
            include: {
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: {
                startsAt: 'asc'
            }
        });

        const sanitizedContests = contests.map(({ id, createdAt, updatedAt, ...remainingData }) => remainingData);
        res.json(sanitizedContests);
    } catch (error) {
        res.status(500).json({ message: 'Error while fetching contests' })
    }
}