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

// Get all challenges with pagination and filters
app.get('/api/challenges', optionalAuthenticate, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      difficulty, 
      category, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { isActive: true };
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get challenges with count
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
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.challenge.count({ where })
    ]);

    // If user is authenticated, get their submission status
    let userSubmissions: any = {};
    if (req.user) {
      const submissions = await prisma.submission.findMany({
        where: {
          userId: req.user.id,
          challengeId: { in: challenges.map(c => c.id) },
          status: 'ACCEPTED'
        },
        select: { challengeId: true }
      });
      userSubmissions = Object.fromEntries(
        submissions.map(s => [s.challengeId, true])
      );
    }

    res.json({
      success: true,
      challenges: challenges.map(c => ({
        ...c,
        solved: userSubmissions[c.id] || false,
        submissionCount: c._count.submissions
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

// Get challenge by ID
app.get('/api/challenges/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;

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

// Get challenge by slug
app.get('/api/challenges/slug/:slug', optionalAuthenticate, async (req, res) => {
  try {
    const { slug } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { slug },
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

    let userSubmission = null;
    if (req.user) {
      userSubmission = await prisma.submission.findFirst({
        where: {
          userId: req.user.id,
          challengeId: challenge.id,
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
    console.error('Get challenge by slug error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get challenge submissions
app.get('/api/challenges/:id/submissions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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

// Get submissions with query params
app.get('/api/challenges/submissions', authenticate, async (req, res) => {
  try {
    const { challengeId, page = '1', limit = '10' } = req.query;

    if (!challengeId) {
      return res.status(400).json({ message: 'Challenge ID is required' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { 
          challengeId: challengeId as string,
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
          challengeId: challengeId as string,
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Challenges Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
