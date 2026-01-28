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
      orderBy: { joinedAt: 'desc' }
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Users Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
