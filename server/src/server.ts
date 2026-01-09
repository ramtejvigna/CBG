import express from "express";
import cors from "cors";
import { PORT } from "./constants.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import challengeRoutes from "./routes/challengeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import activityRoutes from "./routes/activityRoutes.js"
import contestRoutes from "./routes/contestRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import executeRoutes from "./routes/executeRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import { initializeRankingSystem, shutdownRankingSystem } from "./lib/rankingScheduler.js";
import { initializeContestScheduler, shutdownContestScheduler } from "./lib/contestScheduler.js";
import { 
    generalRateLimit,
    authRateLimit,
    adminRateLimit,
    searchRateLimit,
    codeExecutionRateLimit
} from "./middleware/optimizedRateLimiter.js";
import { simpleApiLogger } from "./middleware/simpleLogger.js";
import compression from 'compression';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Middleware
app.use(compression()); // Enable gzip compression
app.use(express.json({ limit: '5mb' })); // Reduced limit for better performance
app.use(express.urlencoded({ limit: '5mb', extended: true })); // Also handle form data

// Configure CORS properly
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simplified logging
app.use(simpleApiLogger);

// General rate limiting
app.use(generalRateLimit);

// Routes with specific rate limiting
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/execute', codeExecutionRateLimit, executeRoutes);
app.use('/api/search', searchRateLimit, searchRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRateLimit, adminRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.get('/api/status', (req, res) => {
    res.status(200).json({
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    
    // Handle payload too large errors specifically
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Request payload too large. Please use a smaller image (max 5MB).',
            error: 'PAYLOAD_TOO_LARGE'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    
    try {
        // Connect to database
        const { connectDB } = await import('./lib/prisma.js');
        await connectDB();
        
        // Initialize ranking system
        await initializeRankingSystem();
        
        // Initialize contest scheduler
        await initializeContestScheduler();
        
        console.log('All systems initialized successfully');
    } catch (error) {
        console.error('Failed to initialize systems:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    shutdownRankingSystem();
    shutdownContestScheduler();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    shutdownRankingSystem();
    shutdownContestScheduler();
    process.exit(0);
});