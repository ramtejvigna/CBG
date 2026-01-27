import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { executeCode } from './controllers/executeController.js';
import { authenticate } from './middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy for accurate IP addresses (when behind nginx/load balancer)
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '5mb' }));

// Configure CORS
const allowedOrigins = [
  process.env.API_GATEWAY_URL,
  process.env.LAMBDA_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      return callback(null, true);
    }
    
    // In production, be strict about origins
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Request-Id']
}));

// Rate limiting for code execution
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 executions per minute per IP
  message: { 
    success: false, 
    message: 'Too many code executions. Please wait a moment before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available (from API Gateway/Lambda)
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'code-execution',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  try {
    // Check Docker availability
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    
    let dockerStatus = 'unknown';
    try {
      await execPromise('docker ps');
      dockerStatus = 'running';
    } catch {
      dockerStatus = 'unavailable';
    }

    // Check sandbox image
    let sandboxImage = 'unknown';
    try {
      const { stdout } = await execPromise('docker images code-execution-sandbox:latest --format "{{.ID}}"');
      sandboxImage = stdout.trim() ? 'available' : 'missing';
    } catch {
      sandboxImage = 'error';
    }

    res.json({
      status: 'OK',
      service: 'code-execution',
      timestamp: new Date().toISOString(),
      checks: {
        docker: dockerStatus,
        sandboxImage: sandboxImage
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Code execution endpoint with rate limiting and authentication
app.post('/execute', executionLimiter, authenticate, executeCode);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found. Use POST /execute for code execution.' 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Code execution service error:', err);
  
  // Handle specific errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false, 
      message: 'Origin not allowed' 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🐳 =====================================');
  console.log('🐳  CBG Code Execution Service');
  console.log('🐳 =====================================');
  console.log(`🐳  Status: Running`);
  console.log(`🐳  Port: ${PORT}`);
  console.log(`🐳  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🐳  Health: http://localhost:${PORT}/health`);
  console.log(`🐳  Execute: POST http://localhost:${PORT}/execute`);
  console.log('🐳 =====================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
