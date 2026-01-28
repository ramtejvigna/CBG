import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import prisma from '../lib/prisma.js';
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

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEYS.CATEGORIES);
    if (cached) {
      return res.json({ success: true, categories: cached });
    }

    const categories = await prisma.challengeCategory.findMany({
      include: {
        _count: {
          select: { challenges: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedCategories = categories.map((c: any) => ({
      ...c,
      challengeCount: c._count.challenges
    }));

    // Cache for 30 minutes
    cache.setMedium(CACHE_KEYS.CATEGORIES, formattedCategories);

    res.json({ success: true, categories: formattedCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get category by ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    const category = await prisma.challengeCategory.findUnique({
      where: { id },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            points: true
          }
        },
        _count: {
          select: { challenges: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category: {
        ...category,
        challengeCount: category._count.challenges
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Categories Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
