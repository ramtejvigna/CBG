import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { authenticateAdmin } from '../middleware/auth.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// All admin routes require admin authentication
app.use('/api/admin', authenticateAdmin);

// Get dashboard statistics
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
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { username: true } },
          challenge: { select: { title: true } }
        }
      })
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers,
          totalChallenges,
          totalSubmissions,
          totalContests
        },
        recentUsers,
        recentSubmissions
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
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
app.put('/api/admin/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all challenges (admin)
app.get('/api/admin/challenges', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        include: {
          category: true,
          languages: true,
          _count: {
            select: { submissions: true, testCases: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.challenge.count()
    ]);

    res.json({
      success: true,
      challenges,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get admin challenges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create challenge
app.post('/api/admin/challenges', async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      difficulty,
      points,
      timeLimit,
      memoryLimit,
      categoryId,
      languageIds,
      testCases,
      starterCode,
      constraints
    } = req.body;

    // Validate required fields
    if (!title || !slug || !description || !difficulty || !categoryId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        slug,
        description,
        difficulty,
        points: points || 100,
        timeLimit: timeLimit || 5,
        memoryLimit: memoryLimit || 256,
        categoryId,
        starterCode,
        constraints,
        isActive: true,
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
    const { id } = req.params;
    const updateData = req.body;

    // Handle language updates separately
    const { languageIds, testCases, ...data } = updateData;

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...data,
        languages: languageIds ? {
          set: languageIds.map((lid: string) => ({ id: lid }))
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
    const { id } = req.params;

    await prisma.challenge.delete({ where: { id } });

    res.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all contests (admin)
app.get('/api/admin/contests', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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
      challengeIds
    } = req.body;

    if (!title || !startsAt || !endsAt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
        maxParticipants,
        status: 'UPCOMING',
        challenges: challengeIds ? {
          create: challengeIds.map((cid: string, index: number) => ({
            challengeId: cid,
            order: index + 1,
            points: 100
          }))
        } : undefined
      },
      include: {
        challenges: {
          include: { challenge: true }
        }
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
    const { id } = req.params;
    const { challengeIds, ...updateData } = req.body;

    // Convert date strings to Date objects
    if (updateData.startsAt) updateData.startsAt = new Date(updateData.startsAt);
    if (updateData.endsAt) updateData.endsAt = new Date(updateData.endsAt);
    if (updateData.registrationEnd) updateData.registrationEnd = new Date(updateData.registrationEnd);

    const contest = await prisma.contest.update({
      where: { id },
      data: updateData,
      include: {
        challenges: { include: { challenge: true } },
        _count: { select: { participants: true } }
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
    const { id } = req.params;

    await prisma.contest.delete({ where: { id } });

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
