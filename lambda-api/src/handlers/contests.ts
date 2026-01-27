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

// Get all contests
app.get('/api/contests', optionalAuthenticate, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status,
      sortBy = 'startsAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: {
          _count: {
            select: { 
              participants: true,
              challenges: true
            }
          }
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum
      }),
      prisma.contest.count({ where })
    ]);

    // Check registration status if user is authenticated
    let userRegistrations: Record<string, boolean> = {};
    if (req.user) {
      const registrations = await prisma.contestParticipant.findMany({
        where: {
          userId: req.user.id,
          contestId: { in: contests.map(c => c.id) }
        },
        select: { contestId: true }
      });
      userRegistrations = Object.fromEntries(
        registrations.map(r => [r.contestId, true])
      );
    }

    res.json({
      success: true,
      contests: contests.map(c => ({
        ...c,
        participantCount: c._count.participants,
        challengeCount: c._count.challenges,
        isRegistered: userRegistrations[c.id] || false
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming contests
app.get('/api/contests/upcoming', async (req, res) => {
  try {
    const contests = await prisma.contest.findMany({
      where: {
        status: { in: ['UPCOMING', 'REGISTRATION_OPEN'] },
        startsAt: { gt: new Date() }
      },
      include: {
        _count: {
          select: { participants: true, challenges: true }
        }
      },
      orderBy: { startsAt: 'asc' },
      take: 5
    });

    res.json({
      success: true,
      contests: contests.map(c => ({
        ...c,
        participantCount: c._count.participants,
        challengeCount: c._count.challenges
      }))
    });
  } catch (error) {
    console.error('Get upcoming contests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get contest by ID
app.get('/api/contests/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        challenges: {
          include: {
            challenge: {
              include: {
                category: true,
                languages: true
              }
            }
          }
        },
        participants: {
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
          take: 50
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if user is registered
    let isRegistered = false;
    let userParticipant = null;
    if (req.user) {
      userParticipant = await prisma.contestParticipant.findUnique({
        where: {
          userId_contestId: {
            userId: req.user.id,
            contestId: id
          }
        }
      });
      isRegistered = !!userParticipant;
    }

    res.json({
      success: true,
      contest: {
        ...contest,
        participantCount: contest._count.participants,
        isRegistered,
        userParticipant
      }
    });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register for contest
app.post('/api/contests/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } }
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    // Check if registration is open
    if (contest.status !== 'UPCOMING' && contest.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ message: 'Registration is not open for this contest' });
    }

    // Check if registration deadline passed
    if (contest.registrationEnd && new Date() > contest.registrationEnd) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check max participants
    if (contest.maxParticipants && contest._count.participants >= contest.maxParticipants) {
      return res.status(400).json({ message: 'Contest is full' });
    }

    // Check if already registered
    const existingRegistration = await prisma.contestParticipant.findUnique({
      where: {
        userId_contestId: {
          userId: req.user!.id,
          contestId: id
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this contest' });
    }

    // Register user
    const participant = await prisma.contestParticipant.create({
      data: {
        userId: req.user!.id,
        contestId: id,
        points: 0
      }
    });

    res.json({
      success: true,
      message: 'Successfully registered for contest',
      participant
    });
  } catch (error) {
    console.error('Register for contest error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get contest leaderboard
app.get('/api/contests/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [participants, total] = await Promise.all([
      prisma.contestParticipant.findMany({
        where: { contestId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true
            }
          },
          submissions: {
            include: {
              contestChallenge: {
                include: {
                  challenge: {
                    select: { title: true }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { points: 'desc' },
          { updatedAt: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.contestParticipant.count({ where: { contestId: id } })
    ]);

    res.json({
      success: true,
      leaderboard: participants.map((p, index) => ({
        rank: skip + index + 1,
        user: p.user,
        points: p.points,
        solvedChallenges: p.submissions.filter(s => s.status === 'ACCEPTED').length,
        submissions: p.submissions
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Contests Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
