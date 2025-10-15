import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { dockerExecutor } from '../lib/dockerExecutor.js';
import { SubmissionStatus, ActivityType } from '@prisma/client';
import { updateUserRank } from '../lib/rankingSystem.js';

// Function to calculate and update user's streak
const updateUserStreak = async (userId: string, tx: any) => {
    try {
        console.log(`Calculating streak for user ${userId}`);
        
        // Get all successful submissions for this user, ordered by date
        const successfulSubmissions = await tx.submission.findMany({
            where: {
                userId: userId,
                status: SubmissionStatus.ACCEPTED
            },
            select: {
                createdAt: true,
                challengeId: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (successfulSubmissions.length === 0) {
            console.log(`No successful submissions found for user ${userId}`);
            return 0;
        }

        // Group submissions by date (ignoring time) - only keep unique dates
        const submissionDates = new Set<string>();
        
        for (const submission of successfulSubmissions) {
            const dateKey = submission.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
            submissionDates.add(dateKey);
        }

        // Convert to sorted array (most recent first)
        const sortedDates = Array.from(submissionDates).sort().reverse();

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0] || '';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0] || '';
        
        // Check if user has a submission today or yesterday (streak can continue from yesterday)
        let streakStartDate = todayStr;
        if (todayStr && submissionDates.has(todayStr)) {
            streakStartDate = todayStr;
        } else if (yesterdayStr && submissionDates.has(yesterdayStr)) {
            streakStartDate = yesterdayStr;
        } else {
            // No recent submission, streak is 0
            console.log(`No submission today or yesterday for user ${userId}, streak is 0`);
            return 0;
        }
        
        // Count consecutive days backwards from the streak start date
        let checkDate = new Date(streakStartDate + 'T00:00:00.000Z');
        
        while (true) {
            const dateKey = checkDate.toISOString().split('T')[0];
            
            if (dateKey && submissionDates.has(dateKey)) {
                currentStreak++;
                // Move to previous day
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Streak is broken
                break;
            }
        }

        console.log(`Calculated streak for user ${userId}: ${currentStreak} days`);
        return currentStreak;
    } catch (error) {
        console.error(`Error calculating streak for user ${userId}:`, error);
        return 0;
    }
};

// Function to check for streak milestones and create activities
const checkStreakMilestones = async (userId: string, newStreak: number, oldStreak: number, tx: any) => {
    try {
        // Define streak milestones (days that deserve special recognition)
        const milestones = [3, 7, 14, 30, 50, 100, 365];
        
        // Check if user just reached a new milestone
        const newMilestone = milestones.find(milestone => 
            newStreak >= milestone && oldStreak < milestone
        );
        
        if (newMilestone) {
            console.log(`User ${userId} reached ${newMilestone}-day streak milestone!`);
            
            // Calculate bonus points based on milestone
            let bonusPoints = 0;
            if (newMilestone <= 7) bonusPoints = 25;
            else if (newMilestone <= 30) bonusPoints = 50;
            else if (newMilestone <= 100) bonusPoints = 100;
            else bonusPoints = 200;
            
            // Update user points for milestone
            await tx.userProfile.update({
                where: { userId: userId },
                data: {
                    points: {
                        increment: bonusPoints
                    }
                }
            });
            
            // Create milestone activity
            await tx.activity.create({
                data: {
                    userId: userId,
                    type: ActivityType.CHALLENGE,
                    name: `${newMilestone}-Day Streak Milestone`,
                    result: `Reached ${newMilestone} consecutive days of solving challenges (+${bonusPoints} bonus points)`,
                    points: bonusPoints,
                    time: new Date().toLocaleTimeString()
                }
            });
            
            console.log(`Created streak milestone activity for user ${userId}: ${newMilestone} days (+${bonusPoints} points)`);
        }
    } catch (error) {
        console.error(`Error checking streak milestones for user ${userId}:`, error);
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

        // Contest validation if contestId is provided
        let contestChallenge = null;
        let contestParticipant = null;
        if (contestId && isSubmission && userId) {
            // Check if contest exists and is ongoing
            const contest = await prisma.contest.findUnique({
                where: { id: contestId },
                select: { 
                    status: true, 
                    startsAt: true, 
                    endsAt: true,
                    title: true 
                }
            });

            if (!contest) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Contest not found' 
                });
            }

            if (contest.status !== 'ONGOING') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Contest is not currently ongoing' 
                });
            }

            const now = new Date();
            if (now < contest.startsAt || now > contest.endsAt) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Contest is not active' 
                });
            }

            // Check if user is registered for the contest
            contestParticipant = await prisma.contestParticipant.findUnique({
                where: {
                    userId_contestId: {
                        userId: userId,
                        contestId: contestId
                    }
                }
            });

            if (!contestParticipant) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User is not registered for this contest' 
                });
            }

            // Get contest challenge details
            contestChallenge = await prisma.contestChallenge.findUnique({
                where: {
                    contestId_challengeId: {
                        contestId: contestId,
                        challengeId: challengeId
                    }
                },
                include: {
                    challenge: {
                        select: {
                            title: true,
                            difficulty: true
                        }
                    }
                }
            });

            if (!contestChallenge) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Challenge not found in this contest' 
                });
            }
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
                console.log(`Starting transaction for user ${userId}, challenge ${challengeId}, contest: ${contestId || 'none'}, status: ${overallStatus}`);
                
                // Use a single transaction for all database operations
                await prisma.$transaction(async (tx) => {
                    // If this is a contest submission, handle it via contest submission logic
                    if (contestId && contestChallenge && contestParticipant) {
                        console.log(`Creating contest submission for user ${userId}, contest ${contestId}`);
                        
                        // Calculate points for contest submission
                        const submissionPoints = allPassed ? contestChallenge.points : 0;

                        // Create or update contest submission
                        const contestSubmission = await tx.contestSubmission.upsert({
                            where: {
                                participantId_contestChallengeId: {
                                    participantId: contestParticipant.id,
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
                                participantId: contestParticipant.id,
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
                                    participantId: contestParticipant.id,
                                    contestChallengeId: contestChallenge.id,
                                    status: SubmissionStatus.ACCEPTED,
                                    id: { not: contestSubmission.id }
                                }
                            });

                            // Only update points if this is the first successful submission or if it's better
                            if (!existingSuccessfulSubmission) {
                                // Update participant points
                                await tx.contestParticipant.update({
                                    where: { id: contestParticipant.id },
                                    data: {
                                        points: {
                                            increment: submissionPoints
                                        }
                                    }
                                });

                                // Update user profile points and create activity
                                await tx.userProfile.upsert({
                                    where: { userId: userId },
                                    update: {
                                        points: {
                                            increment: submissionPoints
                                        }
                                    },
                                    create: {
                                        userId: userId,
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

                                // Create activity record for contest submission
                                await tx.activity.create({
                                    data: {
                                        userId: userId,
                                        type: ActivityType.CONTEST,
                                        name: `Contest Submission: ${challenge.title}`,
                                        result: `Successfully solved contest challenge (+${submissionPoints} points)`,
                                        points: submissionPoints,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });

                                console.log(`Contest submission successful - awarded ${submissionPoints} points to user ${userId}`);
                            } else {
                                console.log(`User ${userId} already solved this contest challenge - updating submission without points`);
                                
                                // Create activity for re-submission but no points
                                await tx.activity.create({
                                    data: {
                                        userId: userId,
                                        type: ActivityType.CONTEST,
                                        name: `Contest Submission: ${challenge.title}`,
                                        result: `Re-solved contest challenge (no additional points)`,
                                        points: 0,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });
                            }
                        } else {
                            console.log(`Failed contest submission for user ${userId}`);
                            
                            // Create activity for failed contest submission
                            await tx.activity.create({
                                data: {
                                    userId: userId,
                                    type: ActivityType.CONTEST,
                                    name: `Contest Submission: ${challenge.title}`,
                                    result: `Attempted contest challenge - ${overallStatus.replace(/_/g, ' ').toLowerCase()}`,
                                    points: 0,
                                    time: new Date().toLocaleTimeString()
                                }
                            });
                        }
                    } else {
                        // Regular challenge submission (not contest)
                        console.log(`Creating regular submission for user ${userId}`);
                        
                        // Create the submission first
                        const submission = await tx.submission.create({
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

                        console.log(`Submission created with ID: ${submission.id}`);

                        // Handle points and activity based on submission status
                        if (overallStatus === SubmissionStatus.ACCEPTED) {
                            console.log(`Checking for previous successful submissions for user ${userId}, challenge ${challengeId}`);
                            
                            // Check if this is the user's first successful submission for this challenge
                            const previousSuccessfulSubmission = await tx.submission.findFirst({
                                where: {
                                    userId: userId,
                                    challengeId: challengeId,
                                    status: SubmissionStatus.ACCEPTED,
                                    id: { not: submission.id }
                                }
                            });

                            // Only award points if this is the first successful submission for this challenge
                            if (!previousSuccessfulSubmission) {
                                console.log(`First successful submission - updating user profile for user ${userId}`);
                                
                                // Get current streak before update
                                const currentProfile = await tx.userProfile.findUnique({
                                    where: { userId: userId },
                                    select: { streakDays: true }
                                });
                                const oldStreak = currentProfile?.streakDays || 0;
                                
                                // Calculate current streak (this will include the current successful submission)
                                const currentStreak = await updateUserStreak(userId, tx);
                                
                                // Update user profile points, solved count, and streak
                                const updatedProfile = await tx.userProfile.upsert({
                                    where: { userId: userId },
                                    update: {
                                        points: {
                                            increment: challenge.points
                                        },
                                        solved: {
                                            increment: 1
                                        },
                                        streakDays: currentStreak
                                    },
                                    create: {
                                        userId: userId,
                                        rank: null,
                                        bio: "No bio provided",
                                        phone: null,
                                        solved: 1,
                                        preferredLanguage: "javascript",
                                        level: 1,
                                        points: challenge.points,
                                        streakDays: currentStreak
                                    }
                                });

                                // Check for streak milestones
                                await checkStreakMilestones(userId, currentStreak, oldStreak, tx);

                                console.log(`User profile updated: ${updatedProfile.solved} solved, ${updatedProfile.points} total points, ${updatedProfile.streakDays} day streak`);

                                // Create activity record for successful submission
                                const activity = await tx.activity.create({
                                    data: {
                                        userId: userId,
                                        type: ActivityType.CHALLENGE,
                                        name: challenge.title,
                                        result: `Successfully solved ${challenge.difficulty.toLowerCase()} challenge (+${challenge.points} points)`,
                                        points: challenge.points,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });

                                console.log(`Activity created with ID: ${activity.id}`);
                                console.log(`Awarded ${challenge.points} points to user ${userId} for solving challenge ${challengeId}`);
                            } else {
                                console.log(`User ${userId} already solved challenge ${challengeId} - updating streak and creating activity without points`);
                                
                                // Get current streak before update
                                const currentProfile = await tx.userProfile.findUnique({
                                    where: { userId: userId },
                                    select: { streakDays: true }
                                });
                                const oldStreak = currentProfile?.streakDays || 0;
                                
                                // Calculate and update current streak even for re-solved challenges
                                const currentStreak = await updateUserStreak(userId, tx);
                                
                                // Update streak in user profile (no points since already solved)
                                await tx.userProfile.update({
                                    where: { userId: userId },
                                    data: {
                                        streakDays: currentStreak
                                    }
                                });

                                // Check for streak milestones
                                await checkStreakMilestones(userId, currentStreak, oldStreak, tx);

                                console.log(`Updated streak for user ${userId}: ${currentStreak} days`);
                                
                                // Create activity for successful submission but no points (already solved)
                                const activity = await tx.activity.create({
                                    data: {
                                        userId: userId,
                                        type: ActivityType.CHALLENGE,
                                        name: challenge.title,
                                        result: `Re-solved ${challenge.difficulty.toLowerCase()} challenge (no additional points)`,
                                        points: 0,
                                        time: new Date().toLocaleTimeString()
                                    }
                                });

                                console.log(`Activity created with ID: ${activity.id} (no points awarded)`);
                            }
                        } else {
                            console.log(`Failed submission - creating activity for user ${userId}`);
                            
                            // Create activity for failed submissions (no points awarded)
                            const activity = await tx.activity.create({
                                data: {
                                    userId: userId,
                                    type: ActivityType.CHALLENGE,
                                    name: challenge.title,
                                    result: `Attempted ${challenge.difficulty.toLowerCase()} challenge - ${overallStatus.replace(/_/g, ' ').toLowerCase()}`,
                                    points: 0,
                                    time: new Date().toLocaleTimeString()
                                }
                            });

                            console.log(`Activity created with ID: ${activity.id} for failed submission`);
                        }
                    }
                }, {
                    timeout: 15000, // 15 second timeout for contest submissions
                });

                console.log(`Transaction completed successfully for user ${userId}`);

                // Update user rank after successful transaction (only for accepted submissions)
                if (overallStatus === SubmissionStatus.ACCEPTED) {
                    try {
                        await updateUserRank(userId);
                        console.log(`Updated rank for user ${userId}`);
                    } catch (rankError) {
                        console.error('Error updating user rank:', rankError);
                        // Don't fail the submission if rank update fails
                    }
                }
            } catch (dbError) {
                console.error('Error in submission transaction:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save submission',
                    error: dbError instanceof Error ? dbError.message : 'Unknown database error'
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
        console.error('Error executing code:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

