import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Get platform statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalChallenges,
      totalSubmissions,
      totalContests,
      recentSubmissions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.challenge.count({ where: { isActive: true } }),
      prisma.submission.count(),
      prisma.contest.count(),
      prisma.submission.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    // Get difficulty distribution
    const difficultyDistribution = await prisma.challenge.groupBy({
      by: ['difficulty'],
      where: { isActive: true },
      _count: { id: true }
    });

    // Get top categories
    const topCategories = await prisma.category.findMany({
      include: {
        _count: { select: { challenges: true } }
      },
      orderBy: {
        challenges: { _count: 'desc' }
      },
      take: 5
    });

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalChallenges,
        totalSubmissions,
        totalContests,
        recentSubmissions,
        difficultyDistribution: Object.fromEntries(
          difficultyDistribution.map(d => [d.difficulty, d._count.id])
        ),
        topCategories: topCategories.map(c => ({
          id: c.id,
          name: c.name,
          challengeCount: c._count.challenges
        }))
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user statistics
app.get('/api/statistics/user', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [
      profile,
      totalSubmissions,
      acceptedSubmissions,
      contestParticipations,
      recentActivity
    ] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.submission.count({ where: { userId } }),
      prisma.submission.count({ where: { userId, status: 'ACCEPTED' } }),
      prisma.contestParticipant.count({ where: { userId } }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Get submission by difficulty
    const submissionsByDifficulty = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      select: {
        challenge: {
          select: { difficulty: true }
        }
      },
      distinct: ['challengeId']
    });

    const difficultyBreakdown = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    submissionsByDifficulty.forEach(s => {
      difficultyBreakdown[s.challenge.difficulty as keyof typeof difficultyBreakdown]++;
    });

    res.json({
      success: true,
      statistics: {
        profile,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: totalSubmissions > 0 
          ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
          : 0,
        contestParticipations,
        difficultyBreakdown,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Statistics Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
