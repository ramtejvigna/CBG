import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { dockerExecutor, SubmissionStatus } from '../lib/dockerExecutor.js';

// Helper to update user streak
const updateUserStreak = async (userId: string, tx: any): Promise<number> => {
    try {
        const submissionDates = await tx.submission.groupBy({
            by: ['createdAt'],
            where: {
                userId: userId,
                status: 'ACCEPTED'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (submissionDates.length === 0) return 0;

        const uniqueDates = new Set(
            submissionDates.map((sub: any) => sub.createdAt.toISOString().split('T')[0])
        );
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const streakStartDate = uniqueDates.has(today) ? today : 
                              uniqueDates.has(yesterday) ? yesterday : null;
        
        if (!streakStartDate) return 0;
        
        let currentStreak = 0;
        let checkDate = new Date(streakStartDate + 'T00:00:00.000Z');
        
        while (true) {
            const dateKey = checkDate.toISOString().split('T')[0];
            if (uniqueDates.has(dateKey)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return currentStreak;
    } catch (error) {
        console.error(`Error calculating streak for user ${userId}:`, error);
        return 0;
    }
};

// Main execute code handler
export const executeCode = async (req: Request, res: Response) => {
    try {
        const { 
            code, 
            language, 
            challengeId, 
            testCaseId, 
            isSubmission, 
            userId,
            contestId 
        } = req.body;

        // Validate required fields
        if (!code || !language || !challengeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: code, language, challengeId' 
            });
        }

        // Get challenge with test cases and languages
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                testCases: true,
                languages: true
            }
        });

        if (!challenge) {
            return res.status(404).json({ 
                success: false, 
                message: 'Challenge not found' 
            });
        }

        // Find language
        const challengeLanguage = challenge.languages.find(
            (lang: any) => lang.name.toLowerCase() === language.toLowerCase()
        );

        if (!challengeLanguage) {
            return res.status(400).json({ 
                success: false, 
                message: `Language ${language} is not supported for this challenge` 
            });
        }

        // Contest validation
        let contestChallenge = null;
        let contestParticipant = null;
        
        if (contestId && isSubmission && userId) {
            const contest = await prisma.contest.findUnique({
                where: { id: contestId },
                select: { status: true, startsAt: true, endsAt: true }
            });

            if (!contest) {
                return res.status(404).json({ success: false, message: 'Contest not found' });
            }

            if (contest.status !== 'ONGOING') {
                return res.status(400).json({ success: false, message: 'Contest is not currently ongoing' });
            }

            const now = new Date();
            if (now < contest.startsAt || now > contest.endsAt) {
                return res.status(400).json({ success: false, message: 'Contest is not active' });
            }

            contestParticipant = await prisma.contestParticipant.findUnique({
                where: { userId_contestId: { userId, contestId } }
            });

            if (!contestParticipant) {
                return res.status(400).json({ success: false, message: 'User is not registered for this contest' });
            }

            contestChallenge = await prisma.contestChallenge.findUnique({
                where: { contestId_challengeId: { contestId, challengeId } },
                include: { challenge: { select: { title: true, difficulty: true } } }
            });

            if (!contestChallenge) {
                return res.status(404).json({ success: false, message: 'Challenge not found in this contest' });
            }
        }

        // Get test cases
        let testCases;
        if (isSubmission) {
            testCases = challenge.testCases;
        } else {
            if (testCaseId) {
                testCases = challenge.testCases.filter((tc: any) => tc.id === testCaseId);
            } else {
                testCases = challenge.testCases.filter((tc: any) => !tc.isHidden).slice(0, 1);
            }
        }

        if (testCases.length === 0) {
            return res.status(400).json({ success: false, message: 'No test cases available' });
        }

        console.log(`Executing code for challenge ${challengeId}, language: ${language}, test cases: ${testCases.length}`);

        // Execute code in Docker containers (parallel)
        const testResults = await Promise.all(testCases.map(async (testCase: any) => {
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

        // Calculate results
        const passedTests = testResults.filter((r: any) => r.passed).length;
        const totalTests = testResults.length;
        const allPassed = passedTests === totalTests;
        const avgRuntime = Math.round(testResults.reduce((sum: number, r: any) => sum + (r.runtime || 0), 0) / testResults.length);
        const avgMemory = Math.round(testResults.reduce((sum: number, r: any) => sum + (r.memory || 0), 0) / testResults.length);
        
        // Determine overall status
        let overallStatus: SubmissionStatus = SubmissionStatus.ACCEPTED;
        
        if (!allPassed) {
            const failedResults = testResults.filter((r: any) => !r.passed);
            if (failedResults.some((r: any) => r.status === SubmissionStatus.COMPILATION_ERROR)) {
                overallStatus = SubmissionStatus.COMPILATION_ERROR;
            } else if (failedResults.some((r: any) => r.status === SubmissionStatus.RUNTIME_ERROR)) {
                overallStatus = SubmissionStatus.RUNTIME_ERROR;
            } else if (failedResults.some((r: any) => r.status === SubmissionStatus.MEMORY_LIMIT_EXCEEDED)) {
                overallStatus = SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
            } else if (failedResults.some((r: any) => r.status === SubmissionStatus.TIME_LIMIT_EXCEEDED)) {
                overallStatus = SubmissionStatus.TIME_LIMIT_EXCEEDED;
            } else {
                overallStatus = SubmissionStatus.WRONG_ANSWER;
            }
        }

        console.log(`Execution complete: ${passedTests}/${totalTests} passed, status: ${overallStatus}`);

        // Save submission if this is a submission
        if (isSubmission && userId) {
            try {
                await prisma.$transaction(async (tx) => {
                    if (contestId && contestChallenge && contestParticipant) {
                        // Contest submission logic
                        const submissionPoints = allPassed ? contestChallenge.points : 0;

                        await tx.contestSubmission.upsert({
                            where: {
                                participantId_contestChallengeId: {
                                    participantId: contestParticipant.id,
                                    contestChallengeId: contestChallenge.id
                                }
                            },
                            update: {
                                code,
                                languageId: challengeLanguage.id,
                                status: overallStatus,
                                points: submissionPoints,
                                runtime: avgRuntime,
                                memory: avgMemory,
                                testResults
                            },
                            create: {
                                participantId: contestParticipant.id,
                                contestChallengeId: contestChallenge.id,
                                code,
                                languageId: challengeLanguage.id,
                                status: overallStatus,
                                points: submissionPoints,
                                runtime: avgRuntime,
                                memory: avgMemory,
                                testResults
                            }
                        });

                        if (overallStatus === SubmissionStatus.ACCEPTED) {
                            const existingSuccess = await tx.contestSubmission.findFirst({
                                where: {
                                    participantId: contestParticipant.id,
                                    contestChallengeId: contestChallenge.id,
                                    status: 'ACCEPTED'
                                }
                            });

                            if (!existingSuccess) {
                                await tx.contestParticipant.update({
                                    where: { id: contestParticipant.id },
                                    data: { points: { increment: submissionPoints } }
                                });

                                await tx.userProfile.upsert({
                                    where: { userId },
                                    update: { points: { increment: submissionPoints } },
                                    create: {
                                        userId,
                                        bio: "No bio provided",
                                        solved: 0,
                                        preferredLanguage: "javascript",
                                        level: 1,
                                        points: submissionPoints,
                                        streakDays: 0
                                    }
                                });

                                await tx.activity.create({
                                    data: {
                                        userId,
                                        type: 'CONTEST',
                                        name: `Contest: ${challenge.title}`,
                                        result: `Solved (+${submissionPoints} pts)`,
                                        points: submissionPoints,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });
                            }
                        }
                    } else {
                        // Regular submission
                        const [previousSuccess, currentProfile] = await Promise.all([
                            overallStatus === SubmissionStatus.ACCEPTED ? 
                                tx.submission.findFirst({
                                    where: { userId, challengeId, status: 'ACCEPTED' },
                                    select: { id: true }
                                }) : Promise.resolve(null),
                            tx.userProfile.findUnique({
                                where: { userId },
                                select: { streakDays: true }
                            })
                        ]);

                        await tx.submission.create({
                            data: {
                                userId,
                                challengeId,
                                code,
                                languageId: challengeLanguage.id,
                                status: overallStatus,
                                runtime: avgRuntime,
                                memory: avgMemory,
                                testResults
                            }
                        });

                        if (overallStatus === SubmissionStatus.ACCEPTED) {
                            const currentStreak = await updateUserStreak(userId, tx);
                            const isFirstSolution = !previousSuccess;

                            if (isFirstSolution) {
                                await tx.userProfile.upsert({
                                    where: { userId },
                                    update: {
                                        points: { increment: challenge.points },
                                        solved: { increment: 1 },
                                        streakDays: currentStreak
                                    },
                                    create: {
                                        userId,
                                        bio: "No bio provided",
                                        solved: 1,
                                        preferredLanguage: "javascript",
                                        level: 1,
                                        points: challenge.points,
                                        streakDays: currentStreak
                                    }
                                });

                                await tx.activity.create({
                                    data: {
                                        userId,
                                        type: 'CHALLENGE',
                                        name: challenge.title,
                                        result: `Solved ${challenge.difficulty.toLowerCase()} (+${challenge.points} pts)`,
                                        points: challenge.points,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });
                            } else {
                                await tx.userProfile.update({
                                    where: { userId },
                                    data: { streakDays: currentStreak }
                                });
                            }
                        }
                    }
                }, { timeout: 15000 });

                console.log(`Submission saved for user ${userId}`);
            } catch (dbError) {
                console.error('Database error:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save submission',
                    error: dbError instanceof Error ? dbError.message : 'Database error'
                });
            }
        }

        res.json({
            success: true,
            testResults,
            runtime: avgRuntime,
            memory: avgMemory,
            allPassed,
            passedTests,
            totalTests,
            compilationError: overallStatus === SubmissionStatus.COMPILATION_ERROR,
            status: overallStatus
        });

    } catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
