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

// Admin middleware
const adminOnly = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply auth to all routes
app.use(authenticate);
app.use(adminOnly);

// Get admin dashboard stats
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalChallenges,
      totalSubmissions,
      totalContests,
      recentUsers,
      recentSubmissions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.challenge.count(),
      prisma.submission.count(),
      prisma.contest.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      prisma.submission.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
    ]);

    res.json({
      success: true,
      dashboard: {
        totalUsers,
        totalChallenges,
        totalSubmissions,
        totalContests,
        recentUsers,
        recentSubmissions
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';
    const search = req.query.search as string;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userProfile: true,
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      users: users.map(u => ({
        ...u,
        password: undefined,
        submissionCount: u._count.submissions
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user role
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, email, role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role }
    });

    res.json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all challenges (admin)
app.get('/api/admin/challenges', async (req, res) => {
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
});

// Create challenge
app.post('/api/admin/challenges', async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      points,
      timeLimit,
      memoryLimit,
      categoryId,
      languageIds,
      testCases
    } = req.body;

    // Validate required fields
    if (!title || !description || !difficulty || !categoryId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        difficulty,
        points: points || 100,
        timeLimit: timeLimit || 5,
        memoryLimit: memoryLimit || 256,
        categoryId,
        creatorId: req.user!.id,
        languages: languageIds ? {
          connect: languageIds.map((id: string) => ({ id }))
        } : undefined,
        testCases: testCases ? {
          create: testCases.map((tc: any) => ({
            input: tc.input,
            output: tc.output,
            isHidden: tc.isHidden || false
          }))
        } : undefined
      },
      include: {
        category: true,
        languages: true,
        testCases: true
      }
    });

    res.status(201).json({ success: true, challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update challenge
app.put('/api/admin/challenges/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const {
      title,
      description,
      difficulty,
      points,
      timeLimit,
      memoryLimit,
      categoryId,
      languageIds
    } = req.body;

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        points,
        timeLimit,
        memoryLimit,
        categoryId,
        languages: languageIds ? {
          set: languageIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        category: true,
        languages: true,
        testCases: true
      }
    });

    res.json({ success: true, challenge });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete challenge
app.delete('/api/admin/challenges/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    await prisma.challenge.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all contests (admin)
app.get('/api/admin/contests', async (req, res) => {
  try {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '20';

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        include: {
          _count: {
            select: { participants: true, challenges: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contest.count()
    ]);

    res.json({
      success: true,
      contests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get admin contests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create contest
app.post('/api/admin/contests', async (req, res) => {
  try {
    const {
      title,
      description,
      startsAt,
      endsAt,
      registrationEnd,
      maxParticipants,
      tags
    } = req.body;

    if (!title || !description || !startsAt || !endsAt || !registrationEnd) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        registrationEnd: new Date(registrationEnd),
        maxParticipants,
        tags: tags || [],
        creatorId: req.user!.id,
        status: 'UPCOMING'
      }
    });

    res.status(201).json({ success: true, contest });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update contest
app.put('/api/admin/contests/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const {
      title,
      description,
      startsAt,
      endsAt,
      registrationEnd,
      maxParticipants,
      tags,
      status
    } = req.body;

    const contest = await prisma.contest.update({
      where: { id },
      data: {
        title,
        description,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
        maxParticipants,
        tags,
        status
      }
    });

    res.json({ success: true, contest });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete contest
app.delete('/api/admin/contests/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    await prisma.contest.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Contest deleted' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Admin Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
