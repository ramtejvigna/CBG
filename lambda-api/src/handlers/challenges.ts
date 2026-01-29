import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { cache, CACHE_KEYS } from '../lib/cache.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Get all challenges
app.get('/api/challenges', optionalAuthenticate, async (req, res) => {
  try {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';
    const difficulty = req.query.difficulty as string;
    const categoryId = req.query.categoryId as string;
    const search = req.query.search as string;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (difficulty) {
      where.difficulty = difficulty.toUpperCase();
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          category: true,
          languages: true,
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.challenge.count({ where })
    ]);

    // Get user's solved challenges if authenticated
    let solvedChallengeIds: string[] = [];
    if (req.user) {
      const solvedSubmissions = await prisma.submission.findMany({
        where: {
          userId: req.user.id,
          status: 'ACCEPTED'
        },
        select: { challengeId: true },
        distinct: ['challengeId']
      });
      solvedChallengeIds = solvedSubmissions.map(s => s.challengeId);
    }

    res.json({
      success: true,
      challenges: challenges.map(c => ({
        ...c,
        submissionCount: c._count.submissions,
        solved: solvedChallengeIds.includes(c.id)
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/challenges/home', async (req: Request, res: Respect) => {
  try {
    const challenges = await prisma.challenge.findMany({
      take: 4,
      select: {
        id: true,
        title: true,
        difficulty: true,
        points: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    res.json({
      message: 'Internal server error',
      error
    })
  }
})

// Get challenge by ID
app.get('/api/challenges/:id', optionalAuthenticate, async (req, res) => {
  try {
    const id = req.params.id as string;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        category: true,
        languages: true,
        testCases: {
          where: { isHidden: false }
        },
        _count: {
          select: { submissions: true }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get user's submission if authenticated
    let userSubmission = null;
    if (req.user) {
      userSubmission = await prisma.submission.findFirst({
        where: {
          userId: req.user.id,
          challengeId: id,
          status: 'ACCEPTED'
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({
      success: true,
      challenge: {
        ...challenge,
        solved: !!userSubmission,
        submissionCount: challenge._count.submissions
      }
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get challenge submissions
app.get('/api/challenges/:id/submissions', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { 
          challengeId: id,
          userId: req.user!.id
        },
        include: {
          language: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.submission.count({
        where: { 
          challengeId: id,
          userId: req.user!.id
        }
      })
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

// Like/Unlike challenge
app.post('/api/challenges/:id/like', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { isLike } = req.body;

    const existingLike = await prisma.challengeLike.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user!.id,
          challengeId: id
        }
      }
    });

    if (existingLike) {
      if (existingLike.isLike === isLike) {
        // Remove like/dislike
        await prisma.challengeLike.delete({
          where: { id: existingLike.id }
        });
      } else {
        // Update like/dislike
        await prisma.challengeLike.update({
          where: { id: existingLike.id },
          data: { isLike }
        });
      }
    } else {
      // Create new like/dislike
      await prisma.challengeLike.create({
        data: {
          userId: req.user!.id,
          challengeId: id,
          isLike
        }
      });
    }

    // Get updated counts
    const [likes, dislikes] = await Promise.all([
      prisma.challengeLike.count({ where: { challengeId: id, isLike: true } }),
      prisma.challengeLike.count({ where: { challengeId: id, isLike: false } })
    ]);

    res.json({ success: true, likes, dislikes });
  } catch (error) {
    console.error('Like challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Challenges Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
