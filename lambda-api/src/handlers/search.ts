import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Search challenges, users, contests
app.get('/api/search', optionalAuthenticate, async (req, res) => {
  try {
    const q = req.query.q as string;
    const type = (req.query.type as string) || 'all';
    const limit = req.query.limit as string || '10';

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const limitNum = Math.min(parseInt(limit), 50);

    const results: any = {};

    // Search based on type
    if (type === 'all' || type === 'challenges') {
      results.challenges = await prisma.challenge.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          points: true,
          category: { select: { name: true } }
        },
        take: limitNum
      });
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          userProfile: {
            select: { points: true, level: true }
          }
        },
        take: limitNum
      });
    }

    if (type === 'all' || type === 'contests') {
      results.contests = await prisma.contest.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          status: true,
          startsAt: true,
          endsAt: true
        },
        take: limitNum
      });
    }

    res.json({
      success: true,
      query: q,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Search Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
