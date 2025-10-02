import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { dockerExecutor } from '../lib/dockerExecutor.js';
import { SubmissionStatus, ActivityType } from '@prisma/client';
import { updateUserRank } from '../lib/rankingSystem.js';

// Helper function to update user points for successful submission
const updateUserPointsForSubmission = async (userId: string, challengeId: string, challengePoints: number) => {
    try {
        // Check if this is the user's first successful submission for this challenge
        const previousSuccessfulSubmission = await prisma.submission.findFirst({
            where: {
                userId: userId,
                challengeId: challengeId,
                status: SubmissionStatus.ACCEPTED
            }
        });

        // Only award points if this is the first successful submission for this challenge
        if (!previousSuccessfulSubmission) {
            // Get challenge details for activity record
            const challenge = await prisma.challenge.findUnique({
                where: { id: challengeId },
                select: { title: true, difficulty: true }
            });

            if (!challenge) {
                console.error('Challenge not found when updating points');
                return;
            }

            // Use a transaction to ensure data consistency
            await prisma.$transaction(async (tx) => {
                // Update user profile points and solved count
                await tx.userProfile.upsert({
                    where: { userId: userId },
                    update: {
                        points: {
                            increment: challengePoints
                        },
                        solved: {
                            increment: 1
                        }
                    },
                    create: {
                        userId: userId,
                        rank: null,
                        bio: "No bio provided",
                        phone: null,
                        solved: 1,
                        preferredLanguage: "javascript",
                        level: 1,
                        points: challengePoints,
                        streakDays: 0
                    }
                });

                // Create activity record
                await tx.activity.create({
                    data: {
                        userId: userId,
                        type: ActivityType.CHALLENGE,
                        name: `${challenge.title}`,
                        result: `Successfully solved ${challenge.difficulty.toLowerCase()} challenge`,
                        points: challengePoints,
                        time: new Date().toLocaleTimeString()
                    }
                });
            });

            console.log(`Awarded ${challengePoints} points to user ${userId} for solving challenge ${challengeId}`);
            
            // Update user rank after points change
            try {
                await updateUserRank(userId);
                console.log(`Updated rank for user ${userId}`);
            } catch (rankError) {
                console.error('Error updating user rank:', rankError);
                // Don't fail the submission if rank update fails
            }
        } else {
            console.log(`User ${userId} already solved challenge ${challengeId}, no additional points awarded`);
        }
    } catch (error) {
        console.error('Error updating user points for submission:', error);
    }
};

// Execute code in a sandboxed Docker environment
export const executeCode = async (req: Request, res: Response) => {
    try {
        const { 
            code, 
            language, 
            challengeId, 
            testCaseId, 
            isSubmission, 
            userId 
        } = req.body;

        // Validate required fields
        if (!code || !language || !challengeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: code, language, challengeId' 
            });
        }

        // Get challenge with test cases
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
            lang => lang.name.toLowerCase() === language.toLowerCase()
        );

        if (!challengeLanguage) {
            return res.status(400).json({ 
                success: false, 
                message: `Language ${language} is not supported for this challenge` 
            });
        }

        let testCases;
        
        if (isSubmission) {
            // For submissions, test against all test cases
            testCases = challenge.testCases;
        } else {
            // For running code, test against specific test case or first visible one
            if (testCaseId) {
                testCases = challenge.testCases.filter(tc => tc.id === testCaseId);
            } else {
                testCases = challenge.testCases.filter(tc => !tc.isHidden).slice(0, 1);
            }
        }

        if (testCases.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No test cases available' 
            });
        }

        // Execute code in Docker containers for each test case
        const testResults = await Promise.all(testCases.map(async (testCase) => {
            try {
                // Execute code in Docker container
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
            // Get the most severe error status
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

        // If this is a submission and user is provided, save it
        if (isSubmission && userId) {
            try {
                await prisma.submission.create({
                    data: {
                        userId: userId,
                        challengeId: challengeId,
                        code: code,
                        languageId: challengeLanguage.id,
                        status: overallStatus,
                        runtime: avgRuntime,
                        memory: avgMemory,
                        testResults: testResults
                    }
                });

                // Award points and create activity if submission is successful
                if (overallStatus === SubmissionStatus.ACCEPTED) {
                    await updateUserPointsForSubmission(userId, challengeId, challenge.points);
                }
            } catch (dbError) {
                console.error('Error saving submission:', dbError);
                // Don't fail the request if submission saving fails
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
        console.error('Error executing code:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

