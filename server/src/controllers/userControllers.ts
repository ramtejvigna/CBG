import { type Request, type Response } from 'express';
import prisma from '../lib/prisma.js';
import { 
    getLeaderboard as getLeaderboardRanking, 
    getUserRankInfo, 
    updateAllUserRanks 
} from '../lib/rankingSystem.js';
import { cache, CACHE_KEYS } from '../lib/cache.js';

export const getUserSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                code: true,
                status: true,
                runtime: true,
                memory: true,
                createdAt: true,
                testResults: true,
                challenge: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        points: true
                    }
                },
                language: {
                    select: {
                        id: true,
                        name: true
                    }
                }
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

export const getUserSubmissionsByUsername = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 20, status, difficulty } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Get user ID first (cached lookup would be ideal here)
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100); // Cap limit for performance
        const offset = (pageNum - 1) * limitNum;

        // Build optimized where clause
        const where: any = {
            userId: user.id
        };

        if (status) {
            where.status = status;
        }

        if (difficulty) {
            where.challenge = {
                difficulty: difficulty
            };
        }

        // Parallel execution: Get submissions + total count
        const [submissions, totalSubmissions] = await Promise.all([
            prisma.submission.findMany({
                where,
                select: {
                    id: true,
                    code: true,
                    status: true,
                    runtime: true,
                    memory: true,
                    createdAt: true,
                    testResults: true,
                    challenge: {
                        select: {
                            id: true,
                            title: true,
                            difficulty: true,
                            points: true
                        }
                    },
                    language: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: offset,
                take: limitNum
            }),
            prisma.submission.count({
                where
            })
        ]);

        res.json({
            submissions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalSubmissions,
                pages: Math.ceil(totalSubmissions / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Check cache first for user profile data
        const cacheKey = `user_profile_${username}`;
        const cachedProfile = cache.get(cacheKey);
        
        if (cachedProfile) {
            return res.json(cachedProfile);
        }

        // Parallel fetch: User data + Statistics in parallel for better performance
        const [user, userStats] = await Promise.all([
            // Get user with minimal includes first
            prisma.user.findUnique({
                where: { username },
                include: {
                    userProfile: {
                        include: {
                            badges: {
                                orderBy: { createdAt: 'desc' }
                            },
                            languages: {
                                orderBy: { percentage: 'desc' }
                            }
                        }
                    },
                    activites: {
                        take: 10,
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: {
                            submissions: true,
                            challengeAttempts: true,
                            challengeLikes: true,
                            contestParticipations: true
                        }
                    }
                }
            }),
            // Get aggregated statistics in parallel
            prisma.user.findUnique({
                where: { username },
                select: { id: true }
            })
        ]);

        if (!user || !userStats) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optimized parallel statistics calculation with database aggregation
        const [
            submissionStats,
            contestPoints,
            challengePointsData
        ] = await Promise.all([
            // Combined submission statistics in one query
            prisma.submission.groupBy({
                by: ['status'],
                where: { userId: user.id },
                _count: { status: true }
            }),
            // Contest points aggregation
            prisma.contestParticipant.aggregate({
                where: { userId: user.id },
                _sum: { points: true },
                _count: { id: true }
            }),
            // Unique challenge points (more efficient query)
            prisma.submission.findMany({
                where: {
                    userId: user.id,
                    status: 'ACCEPTED'
                },
                select: {
                    challengeId: true,
                    challenge: {
                        select: { points: true }
                    }
                },
                distinct: ['challengeId']
            })
        ]);

        // Process statistics efficiently
        const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count.status, 0);
        const acceptedSubmissions = submissionStats.find(stat => stat.status === 'ACCEPTED')?._count.status || 0;
        
        // Calculate challenge points efficiently
        const challengePoints = challengePointsData.reduce(
            (sum, submission) => sum + submission.challenge.points, 
            0
        );

        const pointsBreakdown = {
            challenges: challengePoints,
            contests: contestPoints._sum.points || 0,
            badges: user.userProfile?.badges.reduce((sum: number, badge: any) => sum + badge.points, 0) || 0,
            discussions: 0 // Future implementation
        };

        // Remove sensitive information
        const { password, ...userWithoutPassword } = user;
        
        const profileData = {
            ...userWithoutPassword,
            stats: {
                totalSubmissions,
                acceptedSubmissions,
                contestParticipations: contestPoints._count.id,
                successRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0
            },
            pointsBreakdown
        };

        // Cache the profile for 5 minutes (user data changes frequently)
        cache.setShort(cacheKey, profileData);
        
        res.json(profileData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Check if user is admin
        // if (req.user?.role !== 'ADMIN') {
        //     return res.status(403).json({ message: 'Not authorized' });
        // }

        const { page = 1, limit = 50 } = req.query; // Add pagination for large datasets
        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100); // Cap for performance
        const offset = (pageNum - 1) * limitNum;

        // Parallel execution: Get users + total count
        const [users, totalUsers] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    image: true,
                    role: true,
                    createdAt: true,
                    userProfile: {
                        select: {
                            rank: true,
                            solved: true,
                            level: true,
                            points: true,
                            streakDays: true
                        }
                    },
                    _count: {
                        select: {
                            submissions: true,
                            challengeAttempts: true,
                            contestParticipations: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: offset,
                take: limitNum
            }),
            prisma.user.count()
        ]);

        res.json({
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limitNum)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        // Cap limits for performance and add input validation
        const limitNum = Math.min(parseInt(limit as string), 100);
        const offsetNum = Math.max(parseInt(offset as string), 0);
        
        const leaderboard = await getLeaderboardRanking(limitNum, offsetNum);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserActivity = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 50); // Cap limit for performance
        
        // Cache key for activities
        const cacheKey = `user_activity_${username}_${pageNum}_${limitNum}`;
        const cachedActivity = cache.get(cacheKey);
        
        if (cachedActivity) {
            return res.json(cachedActivity);
        }

        // Get user ID with caching
        const userCacheKey = `user_basic_${username}`;
        let user: any = cache.get(userCacheKey);
        
        if (!user) {
            user = await prisma.user.findUnique({
                where: { username },
                select: { id: true }
            });
            
            if (user) {
                cache.setMedium(userCacheKey, user); // Cache user ID for 30 minutes
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const offset = (pageNum - 1) * limitNum;

        // Parallel execution: Get activities + total count
        const [activities, totalActivities] = await Promise.all([
            prisma.activity.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    type: true,
                    name: true,
                    result: true,
                    points: true,
                    time: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: offset,
                take: limitNum
            }),
            prisma.activity.count({
                where: { userId: user.id }
            })
        ]);

        const activityData = {
            activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalActivities,
                pages: Math.ceil(totalActivities / limitNum)
            }
        };

        // Cache the activity data for 2 minutes (activities change frequently)
        cache.setShort(cacheKey, activityData);

        res.json(activityData);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserRanking = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const rankInfo = await getUserRankInfo(user.id);
        
        if (!rankInfo) {
            return res.status(404).json({ message: 'User ranking information not found' });
        }

        res.json(rankInfo);
    } catch (error) {
        console.error('Error fetching user ranking:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const refreshRankings = async (req: Request, res: Response) => {
    try {
        // Check if user is admin (optional - you might want to restrict this)
        // if (req.user?.role !== 'ADMIN') {
        //     return res.status(403).json({ message: 'Admin access required' });
        // }

        await updateAllUserRanks();
        
        res.json({ 
            success: true, 
            message: 'Rankings refreshed successfully' 
        });
    } catch (error) {
        console.error('Error refreshing rankings:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserContests = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // Get user ID
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 50); // Cap for performance
        const offset = (pageNum - 1) * limitNum;

        // Parallel execution: Get contest participations + total count
        const [contestParticipations, totalContests] = await Promise.all([
            prisma.contestParticipant.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    points: true,
                    joinedAt: true,
                    contest: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            startsAt: true,
                            endsAt: true,
                            status: true,
                            points: true
                        }
                    },
                    // Optimized submissions with minimal data
                    submissions: {
                        select: {
                            id: true,
                            status: true,
                            points: true,
                            contestChallenge: {
                                select: {
                                    challenge: {
                                        select: {
                                            id: true,
                                            title: true,
                                            difficulty: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    joinedAt: 'desc'
                },
                skip: offset,
                take: limitNum
            }),
            prisma.contestParticipant.count({
                where: { userId: user.id }
            })
        ]);

        res.json({
            contests: contestParticipations,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalContests,
                pages: Math.ceil(totalContests / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching user contests:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        console.log('Update profile request for user:', userId);
        const { name, email, image, profile } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Validate image data if provided
        if (image && typeof image === 'string') {
            // Check if it's a base64 image
            if (image.startsWith('data:image/')) {
                // Extract the base64 part and check size (roughly)
                const base64Data = image.split(',')[1];
                if (base64Data) {
                    // Rough size calculation: base64 is ~1.33x the original size
                    const sizeInBytes = (base64Data.length * 3) / 4;
                    const sizeInMB = sizeInBytes / (1024 * 1024);
                    
                    if (sizeInMB > 5) {
                        return res.status(400).json({ 
                            message: 'Image file is too large. Please use an image smaller than 5MB.' 
                        });
                    }
                }
            }
        }
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { userProfile: true }
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

        // Update user data
        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (image !== undefined) updateData.image = image;

        // Update profile data
        const profileUpdateData: any = {};
        if (profile?.phone !== undefined) profileUpdateData.phone = profile.phone;
        if (profile?.bio !== undefined) profileUpdateData.bio = profile.bio;
        if (profile?.preferredLanguage) profileUpdateData.preferredLanguage = profile.preferredLanguage;

        // Perform the update
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                userProfile: Object.keys(profileUpdateData).length > 0 ? {
                    update: profileUpdateData
                } : undefined
            },
            include: {
                userProfile: {
                    include: {
                        badges: true,
                        languages: true
                    }
                }
            }
        });

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        
        console.log('Profile updated successfully for user:', userId);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        
        // Handle specific payload too large errors
        if (error instanceof Error && error.message.includes('too large')) {
            return res.status(413).json({ 
                message: 'Request payload too large. Please use a smaller image.' 
            });
        }
        
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getUserImage = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true,
                image: true,
                name: true 
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.image) {
            return res.status(404).json({ message: 'User has no profile image' });
        }

        res.json({
            success: true,
            image: user.image,
            userId: user.id,
            name: user.name
        });
    } catch (error) {
        console.error('Error fetching user image:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getCurrentUserImage = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true,
                image: true,
                name: true 
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.image) {
            return res.status(404).json({ message: 'User has no profile image' });
        }

        res.json({
            success: true,
            image: user.image,
            userId: user.id,
            name: user.name
        });
    } catch (error) {
        console.error('Error fetching current user image:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Notification Settings Controllers
export const getUserNotificationSettings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        let notificationSettings = await prisma.notificationSettings.findUnique({
            where: { userId }
        });

        // Create default settings if none exist
        if (!notificationSettings) {
            notificationSettings = await prisma.notificationSettings.create({
                data: { userId }
            });
        }

        res.json({
            success: true,
            settings: notificationSettings
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateUserNotificationSettings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { 
            contestAlerts, 
            leaderboardUpdates, 
            streakAlerts, 
            emailNotifications, 
            digestFrequency 
        } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Validate digestFrequency if provided
        const validFrequencies = ['daily', 'weekly', 'monthly'];
        if (digestFrequency && !validFrequencies.includes(digestFrequency)) {
            return res.status(400).json({ 
                message: 'Invalid digest frequency. Must be daily, weekly, or monthly.' 
            });
        }

        const updateData: any = {};
        if (typeof contestAlerts === 'boolean') updateData.contestAlerts = contestAlerts;
        if (typeof leaderboardUpdates === 'boolean') updateData.leaderboardUpdates = leaderboardUpdates;
        if (typeof streakAlerts === 'boolean') updateData.streakAlerts = streakAlerts;
        if (typeof emailNotifications === 'boolean') updateData.emailNotifications = emailNotifications;
        if (digestFrequency) updateData.digestFrequency = digestFrequency;

        const notificationSettings = await prisma.notificationSettings.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData
            }
        });

        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            settings: notificationSettings
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// Security Settings Controllers
export const getUserSecuritySettings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        let securitySettings = await prisma.securitySettings.findUnique({
            where: { userId },
            select: {
                id: true,
                userId: true,
                twoFactorEnabled: true,
                lastPasswordChange: true,
                passwordChangeRequired: true,
                createdAt: true,
                updatedAt: true
                // Exclude sensitive fields like loginAttempts, lockedUntil
            }
        });

        // Create default settings if none exist
        if (!securitySettings) {
            const newSettings = await prisma.securitySettings.create({
                data: { userId }
            });
            
            securitySettings = {
                id: newSettings.id,
                userId: newSettings.userId,
                twoFactorEnabled: newSettings.twoFactorEnabled,
                lastPasswordChange: newSettings.lastPasswordChange,
                passwordChangeRequired: newSettings.passwordChangeRequired,
                createdAt: newSettings.createdAt,
                updatedAt: newSettings.updatedAt
            };
        }

        res.json({
            success: true,
            settings: securitySettings
        });
    } catch (error) {
        console.error('Error fetching security settings:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateUserSecuritySettings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { twoFactorEnabled } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const updateData: any = {};
        if (typeof twoFactorEnabled === 'boolean') {
            updateData.twoFactorEnabled = twoFactorEnabled;
        }

        const securitySettings = await prisma.securitySettings.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData
            },
            select: {
                id: true,
                userId: true,
                twoFactorEnabled: true,
                lastPasswordChange: true,
                passwordChangeRequired: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            message: 'Security settings updated successfully',
            settings: securitySettings
        });
    } catch (error) {
        console.error('Error updating security settings:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

// User Preferences Controllers
export const getUserPreferences = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        let userPreferences = await prisma.userPreferences.findUnique({
            where: { userId }
        });

        // Create default preferences if none exist
        if (!userPreferences) {
            userPreferences = await prisma.userPreferences.create({
                data: { userId }
            });
        }

        res.json({
            success: true,
            preferences: userPreferences
        });
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateUserPreferences = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { theme, language, codeEditor, timezone } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Validate theme if provided
        const validThemes = ['light', 'dark', 'system'];
        if (theme && !validThemes.includes(theme)) {
            return res.status(400).json({ 
                message: 'Invalid theme. Must be light, dark, or system.' 
            });
        }

        const updateData: any = {};
        if (theme) updateData.theme = theme;
        if (language) updateData.language = language;
        if (codeEditor) updateData.codeEditor = codeEditor;
        if (timezone) updateData.timezone = timezone;

        const userPreferences = await prisma.userPreferences.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData
            }
        });

        res.json({
            success: true,
            message: 'User preferences updated successfully',
            preferences: userPreferences
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
