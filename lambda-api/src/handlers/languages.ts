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

// Get all languages
app.get('/api/languages', async (req, res) => {
  try {
    // Check cache
    const cached = cache.get(CACHE_KEYS.LANGUAGES);
    if (cached) {
      return res.json({ success: true, languages: cached });
    }

    const languages = await prisma.language.findMany({
      orderBy: { name: 'asc' }
    });

    // Cache for 1 hour
    cache.setLong(CACHE_KEYS.LANGUAGES, languages);

    res.json({ success: true, languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Languages Lambda error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export const handler = serverless(app);
