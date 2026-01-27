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
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        profile: true,
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

    const { password: _, resetToken: __, resetTokenExpires: ___, ...userWithoutSensitive } = user;

    res.json({
      success: true,
      user: {
        ...userWithoutSensitive,
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
    const { username } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: user.id },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              slug: true,
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
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const participations = await prisma.contestParticipant.findMany({
      where: { userId: user.id },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      contests: participations.map(p => ({
        ...p.contest,
        points: p.points,
        rank: p.rank
      }))
    });
  } catch (error) {
    console.error('Get user contests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user activity
app.get('/api/profile/:username/activity', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          profile: { isNot: null }
        },
        include: {
          profile: true
        },
        orderBy: {
          profile: { points: 'desc' }
        },
        skip,
        take: limitNum
      }),
      prisma.user.count({
        where: { profile: { isNot: null } }
      })
    ]);

    res.json({
      success: true,
      leaderboard: users.map((user, index) => ({
        rank: skip + index + 1,
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        points: user.profile?.points || 0,
        solved: user.profile?.solved || 0,
        level: user.profile?.level || 1,
        streakDays: user.profile?.streakDays || 0
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
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: req.user!.id },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              slug: true,
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

// Update user profile
app.put('/api/users/:id/profile', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, phone, preferredLanguage, image } = req.body;

    // Verify user is updating their own profile
    if (req.user!.id !== id) {
      return res.status(403).json({ message: 'Cannot update another user\'s profile' });
    }

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          name: name || undefined,
          image: image || undefined
        }
      }),
      prisma.userProfile.upsert({
        where: { userId: id },
        update: {
          bio: bio || undefined,
          phone: phone || undefined,
          preferredLanguage: preferredLanguage || undefined
        },
        create: {
          userId: id,
          bio: bio || 'No bio provided',
          phone,
          preferredLanguage: preferredLanguage || 'javascript',
          solved: 0,
          level: 1,
          points: 0,
          streakDays: 0
        }
      })
    ]);

    res.json({
      success: true,
      user: {
        ...user,
        profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Users Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
