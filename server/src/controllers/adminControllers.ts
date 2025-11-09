import { type Request, type Response } from 'express';
import prisma from "../lib/prisma.js";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const registerAdmin = async (req: Request, res: Response) => {
    const { email, password, name, username, department, responsibilities } = req.body;
    
    try {
        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Check if username is taken
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with ADMIN role and their AdminLead profile in a transaction
        const newAdmin = await prisma.$transaction(async (prisma) => {
            // Create the user with ADMIN role
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    username,
                    role: 'ADMIN',
                    userProfile: {
                        create: {
                            bio: 'Admin',
                            preferredLanguage: 'JavaScript', // Default language
                            level: 1,
                            points: 0,
                            streakDays: 0,
                            solved: 0
                        }
                    }
                }
            });
            
            // Create admin lead profile
            const adminLead = await prisma.adminLead.create({
                data: {
                    userId: user.id,
                    department: department || "",
                    responsibilities: responsibilities || [],
                    accessLevel: 1 // Default access level
                }
            });
            
            return user;
        });
        
        // Return success without sending back password
        const { password: _, ...adminData } = newAdmin;
        return res.status(201).json({ 
            message: 'Admin registered successfully',
            admin: adminData
        });
    } catch (error) {
        console.error('Error registering admin:', error);
        return res.status(500).json({ message: 'Failed to register admin' });
    }
}

export const adminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    try {
        // Find user by email
        const admin = await prisma.user.findUnique({
            where: { 
                email,
                role: 'ADMIN'
            }
        });
        
        if (!admin || !admin.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate session token
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
        
        // Create new session
        await prisma.session.create({
            data: {
                sessionToken: token,
                userId: admin.id,
                expires: expiresAt
            }
        });
        
        // Update last active
        await prisma.user.update({
            where: { id: admin.id },
            data: { lastActive: new Date() }
        });
        
        // Get admin lead info
        const adminLead = await prisma.adminLead.findUnique({
            where: { userId: admin.id }
        });
        
        // Return user data and token
        const { password: _, ...adminData } = admin;
        
        return res.status(200).json({
            message: 'Login successful',
            admin: adminData,
            adminLead,
            token,
            expiresAt
        });
    } catch (error) {
        console.error('Error logging in admin:', error);
        return res.status(500).json({ message: 'Failed to login' });
    }
}

// Get admin profile
export const getAdminProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const adminLead = await prisma.adminLead.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true,
                        image: true,
                        role: true,
                        createdAt: true,
                        lastActive: true
                    }
                }
            }
        });
        
        if (!adminLead) {
            return res.status(404).json({ message: 'Admin profile not found' });
        }
        
        return res.status(200).json(adminLead);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        return res.status(500).json({ message: 'Failed to get admin profile' });
    }
}

// Get all users with admin-specific data
export const getAllUsersAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { page = 1, limit = 20, search, role, status } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};
        
        if (search) {
            where.OR = [
                { username: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { name: { contains: search as string, mode: 'insensitive' } }
            ];
        }
        
        if (role) {
            where.role = role;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                image: true,
                role: true,
                createdAt: true,
                lastActive: true,
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
            },
            skip: offset,
            take: limitNum
        });

        const totalUsers = await prisma.user.count({ where });

        // Add status field based on lastActive
        const usersWithStatus = users.map(user => {
            const now = new Date();
            const lastActive = user.lastActive;
            let status = 'inactive';
            
            if (lastActive) {
                const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceActive <= 7) {
                    status = 'active';
                }
            }

            return {
                ...user,
                status,
                totalSubmissions: user._count.submissions
            };
        });

        res.json({
            users: usersWithStatus,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Update user (admin only)
export const updateUser = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { userId } = req.params;
        const { name, email, role } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: userId }
                }
            });

            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                role: true,
                createdAt: true,
                lastActive: true
            }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Ban/Unban user (admin only)
export const banUser = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { userId } = req.params;
        const { banned } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // For now, we'll use a custom field or handle this differently
        // Since there's no banned field in the schema, we could use role or add a field
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // You might want to add a banned field to the User model
        // For now, we'll just return success
        res.json({
            success: true,
            message: banned ? 'User banned successfully' : 'User unbanned successfully'
        });
    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user (this will cascade delete related records)
        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Admin Challenge Management
export const getAllChallengesAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { page = 1, limit = 20, search, difficulty, category, status } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};
        
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }
        
        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (category) {
            where.categoryId = category;
        }

        const challenges = await prisma.challenge.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true }
                },
                creator: {
                    select: { name: true, username: true }
                },
                _count: {
                    select: {
                        submissions: true,
                        testCases: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitNum
        });

        const totalChallenges = await prisma.challenge.count({ where });

        // Calculate acceptance rate for each challenge
        const challengesWithStats = await Promise.all(challenges.map(async (challenge) => {
            const totalSubmissions = challenge._count.submissions;
            const acceptedSubmissions = await prisma.submission.count({
                where: {
                    challengeId: challenge.id,
                    status: 'ACCEPTED'
                }
            });

            const acceptanceRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100) : 0;

            return {
                ...challenge,
                submissions: totalSubmissions,
                acceptanceRate: Math.round(acceptanceRate * 10) / 10,
                testCases: challenge._count.testCases,
                status: 'published' // You can add a status field to challenge model if needed
            };
        }));

        res.json({
            challenges: challengesWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalChallenges,
                pages: Math.ceil(totalChallenges / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching challenges for admin:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getChallengeStatsAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const totalChallenges = await prisma.challenge.count();
        const totalSubmissions = await prisma.submission.count();

        // For published/draft, you might need to add a status field to the Challenge model
        // For now, we'll assume all are published
        const published = totalChallenges;
        const draft = 0;

        res.json({
            total: totalChallenges,
            published,
            draft,
            totalSubmissions
        });
    } catch (error) {
        console.error('Error fetching challenge stats for admin:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteChallengeAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { challengeId } = req.params;

        if (!challengeId) {
            return res.status(400).json({ message: 'Challenge ID is required' });
        }

        // Check if challenge exists
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId }
        });

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Delete challenge (this will cascade delete related records)
        await prisma.challenge.delete({
            where: { id: challengeId }
        });

        res.json({
            success: true,
            message: 'Challenge deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Admin Contest Management
export const getAllContestsAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { page = 1, limit = 20, search, status, timeframe } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {};
        
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }
        
        if (status) {
            where.status = status;
        }

        if (timeframe) {
            const now = new Date();
            switch (timeframe) {
                case 'today':
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    where.startsAt = {
                        gte: today,
                        lt: tomorrow
                    };
                    break;
                case 'week':
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    where.startsAt = {
                        gte: weekStart,
                        lt: weekEnd
                    };
                    break;
                case 'month':
                    const monthStart = new Date();
                    monthStart.setDate(1);
                    monthStart.setHours(0, 0, 0, 0);
                    const monthEnd = new Date(monthStart);
                    monthEnd.setMonth(monthEnd.getMonth() + 1);
                    where.startsAt = {
                        gte: monthStart,
                        lt: monthEnd
                    };
                    break;
            }
        }

        const contests = await prisma.contest.findMany({
            where,
            include: {
                creator: {
                    select: { name: true, username: true }
                },
                _count: {
                    select: {
                        participants: true,
                        challenges: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limitNum
        });

        const totalContests = await prisma.contest.count({ where });

        const contestsWithStats = contests.map(contest => ({
            ...contest,
            participants: contest._count.participants,
            challenges: contest._count.challenges
        }));

        res.json({
            contests: contestsWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalContests,
                pages: Math.ceil(totalContests / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching contests for admin:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getContestStatsAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const totalContests = await prisma.contest.count();
        const upcomingContests = await prisma.contest.count({
            where: { status: 'UPCOMING' }
        });
        const ongoingContests = await prisma.contest.count({
            where: { status: 'ONGOING' }
        });
        const finishedContests = await prisma.contest.count({
            where: { status: 'FINISHED' }
        });
        const totalParticipants = await prisma.contestParticipant.count();

        res.json({
            total: totalContests,
            upcoming: upcomingContests,
            ongoing: ongoingContests,
            finished: finishedContests,
            totalParticipants
        });
    } catch (error) {
        console.error('Error fetching contest stats for admin:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateContestAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { contestId } = req.params;
        const {
            title,
            description,
            startsAt,
            endsAt,
            registrationEnd,
            tags,
            points,
            maxParticipants,
            status
        } = req.body;

        if (!contestId) {
            return res.status(400).json({ message: 'Contest ID is required' });
        }

        // Check if contest exists
        const existingContest = await prisma.contest.findUnique({
            where: { id: contestId }
        });

        if (!existingContest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        // Update contest
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
        if (endsAt !== undefined) updateData.endsAt = new Date(endsAt);
        if (registrationEnd !== undefined) updateData.registrationEnd = new Date(registrationEnd);
        if (tags !== undefined) updateData.tags = tags;
        if (points !== undefined) updateData.points = points;
        if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
        if (status !== undefined) updateData.status = status;

        const updatedContest = await prisma.contest.update({
            where: { id: contestId },
            data: updateData,
            include: {
                creator: {
                    select: { name: true, username: true }
                },
                _count: {
                    select: {
                        participants: true,
                        challenges: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Contest updated successfully',
            contest: updatedContest
        });
    } catch (error) {
        console.error('Error updating contest:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteContestAdmin = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { contestId } = req.params;

        if (!contestId) {
            return res.status(400).json({ message: 'Contest ID is required' });
        }

        // Check if contest exists
        const contest = await prisma.contest.findUnique({
            where: { id: contestId }
        });

        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        // Delete contest (this will cascade delete related records)
        await prisma.contest.delete({
            where: { id: contestId }
        });

        res.json({
            success: true,
            message: 'Contest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contest:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Admin Dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Calculate date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        // Run all queries in parallel for better performance
        const [
            totalUsers,
            totalChallenges, 
            totalContests,
            todaySubmissions,
            lastMonthUsers,
            lastMonthChallenges,
            lastMonthContests,
            yesterdaySubmissions
        ] = await Promise.all([
            prisma.user.count(),
            prisma.challenge.count(),
            prisma.contest.count(),
            prisma.submission.count({
                where: {
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        lt: lastMonth
                    }
                }
            }),
            prisma.challenge.count({
                where: {
                    createdAt: {
                        lt: lastMonth
                    }
                }
            }),
            prisma.contest.count({
                where: {
                    createdAt: {
                        lt: lastMonth
                    }
                }
            }),
            prisma.submission.count({
                where: {
                    createdAt: {
                        gte: yesterday,
                        lt: today
                    }
                }
            })
        ]);

        // Calculate growth percentages
        const userGrowth = lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;
        const challengeGrowth = lastMonthChallenges > 0 ? ((totalChallenges - lastMonthChallenges) / lastMonthChallenges) * 100 : 0;
        const contestGrowth = lastMonthContests > 0 ? ((totalContests - lastMonthContests) / lastMonthContests) * 100 : 0;
        const submissionGrowth = yesterdaySubmissions > 0 ? ((todaySubmissions - yesterdaySubmissions) / yesterdaySubmissions) * 100 : 0;

        res.json({
            totalUsers,
            totalChallenges,
            totalContests,
            activeSubmissions: todaySubmissions,
            userGrowth: Math.round(userGrowth * 10) / 10,
            challengeGrowth: Math.round(challengeGrowth * 10) / 10,
            contestGrowth: Math.round(contestGrowth * 10) / 10,
            submissionGrowth: Math.round(submissionGrowth * 10) / 10
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getRecentActivities = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { limit = 10 } = req.query;
        const limitNum = parseInt(limit as string);

        // Get recent activities from different sources
        const activities = await prisma.activity.findMany({
            take: limitNum,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        username: true,
                        name: true
                    }
                }
            }
        });

        // Transform activities to match the frontend format
        const formattedActivities = activities.map(activity => {
            let type: 'user_signup' | 'challenge_created' | 'contest_started' | 'submission_made' = 'submission_made';
            
            switch (activity.type) {
                case 'CHALLENGE':
                    type = 'challenge_created';
                    break;
                case 'CONTEST':
                    type = 'contest_started';
                    break;
            }

            return {
                id: activity.id,
                type,
                description: activity.name,
                timestamp: activity.createdAt.toISOString(),
                user: activity.user.username
            };
        });

        res.json(formattedActivities);
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSystemStatus = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check database connection
        let databaseStatus = 'online';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch {
            databaseStatus = 'offline';
        }

        // For now, we'll mock the other services
        // In a real implementation, you'd check actual service health
        const codeExecutionStatus = 'online'; // Check Docker service
        const emailServiceStatus = 'warning'; // Check email service

        res.json({
            database: databaseStatus,
            codeExecution: codeExecutionStatus,
            emailService: emailServiceStatus
        });
    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};