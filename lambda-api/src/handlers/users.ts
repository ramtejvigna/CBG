import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Get user profile by username
app.get('/api/profile/:username', optionalAuthenticate, async (req, res) => {
  try {
    const username = req.params.username as string;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        userProfile: true,
        submissions: {
          where: { status: 'ACCEPTED' },
          select: { challengeId: true },
          distinct: ['challengeId']
        },
        _count: {
          select: {
            submissions: true,
            contestParticipations: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        solvedChallenges: user.submissions.length,
        totalSubmissions: user._count.submissions,
        contestsParticipated: user._count.contestParticipations
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user submissions
app.get('/api/profile/:username/submissions', async (req, res) => {
  try {
    const username = req.params.username as string;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: user.id },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          },
          language: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.submission.count({ where: { userId: user.id } })
    ]);

    res.json({
      success: true,
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user contest history
app.get('/api/profile/:username/contests', async (req, res) => {
  try {
    const username = req.params.username as string;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [participations, total] = await Promise.all([
      prisma.contestParticipant.findMany({
        where: { userId: user.id },
        include: {
          contest: {
            select: {
              id: true,
              title: true,
              description: true,
              startsAt: true,
              endsAt: true,
              status: true
            }
          },
          submissions: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contestParticipant.count({ where: { userId: user.id } })
    ]);

    res.json({
      success: true,
      contests: participations.map(p => ({
        id: p.id,
        position: p.rank,
        score: p.points,
        points: p.points,
        rank: p.rank,
        joinedAt: p.joinedAt,
        submissions: p.submissions,
        contest: p.contest
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user contests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user activity
app.get('/api/profile/:username/activity', async (req, res) => {
  try {
    const username = req.params.username as string;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.activity.count({ where: { userId: user.id } })
    ]);

    res.json({
      success: true,
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '50';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.userProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { points: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.userProfile.count()
    ]);

    res.json({
      success: true,
      leaderboard: users.map((profile, index) => ({
        rank: skip + index + 1,
        id: profile.user.id,
        username: profile.user.username,
        name: profile.user.name,
        image: profile.user.image,
        points: profile.points,
        solved: profile.solved,
        level: profile.level,
        streakDays: profile.streakDays
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user's submissions
app.get('/api/submissions', authenticate, async (req, res) => {
  try {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: req.user!.id },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              difficulty: true
            }
          },
          language: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.submission.count({ where: { userId: req.user!.id } })
    ]);

    res.json({
      success: true,
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user ranking
app.get('/api/profile/:username/ranking', async (req, res) => {
  try {
    const username = req.params.username as string;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        rank: true,
        points: true,
        solved: true,
        level: true,
        streakDays: true,
        user: {
          select: {
            username: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!userProfile || !userProfile.rank) {
      return res.status(404).json({ message: 'Ranking not available for this user' });
    }

    // Get total number of ranked users
    const totalUsers = await prisma.userProfile.count({
      where: { 
        rank: { not: null }
      }
    });

    // Get users around this user's rank (5 users, centered on current user)
    const offset = Math.max(0, userProfile.rank - 3);
    const nearbyUsers = await prisma.userProfile.findMany({
      where: {
        rank: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { points: 'desc' },
      skip: offset,
      take: 5
    });

    res.json({
      success: true,
      rank: userProfile.rank,
      points: userProfile.points,
      solved: userProfile.solved,
      level: userProfile.level,
      streakDays: userProfile.streakDays,
      username: userProfile.user.username,
      name: userProfile.user.name,
      image: userProfile.user.image,
      totalUsers,
      nearbyUsers: nearbyUsers.map((profile, index) => ({
        rank: offset + index + 1,
        id: profile.user.id,
        username: profile.user.username,
        name: profile.user.name,
        image: profile.user.image,
        points: profile.points,
        solved: profile.solved,
        level: profile.level
      })),
      percentile: Math.round((1 - (userProfile.rank - 1) / totalUsers) * 100)
    });
  } catch (error) {
    console.error('Get user ranking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user image
app.get('/api/:userId/image', async (req, res) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        image: true,
        name: true,
        username: true
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
      name: user.name,
      username: user.username
    });
  } catch (error) {
    console.error('Error fetching user image:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, email, image, profile } = req.body;

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
        userProfile: true
      }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

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
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Users Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
