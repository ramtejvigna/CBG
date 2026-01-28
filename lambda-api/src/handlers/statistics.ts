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
      prisma.challenge.count(),
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
      _count: { _all: true }
    });

    // Get top categories
    const topCategories = await prisma.challengeCategory.findMany({
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
          difficultyDistribution.map(d => [d.difficulty, d._count._all])
        ),
        topCategories: topCategories.map((c: any) => ({
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

    // Get submission history (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const submissionHistory = await prisma.submission.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: { _all: true }
    });

    res.json({
      success: true,
      statistics: {
        profile,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: totalSubmissions > 0 
          ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) 
          : 0,
        contestParticipations,
        recentActivity,
        submissionHistory
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
