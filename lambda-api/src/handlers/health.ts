import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://your-app.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'cbg-lambda-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export const handler = serverless(app);
