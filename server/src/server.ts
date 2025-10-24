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
import { initializeRankingSystem, shutdownRankingSystem } from "./lib/rankingScheduler.js";
import { initializeContestScheduler, shutdownContestScheduler } from "./lib/contestScheduler.js";
import { 
    generalRateLimit, 
    burstProtection, 
    speedLimiter,
    rateLimitInfo,
    adminRateLimit,
    searchRateLimit,
    codeExecutionRateLimit
} from "./middleware/rateLimiter.js";
import { 
    addRateLimitHeaders, 
    logRequest, 
    detectSuspiciousActivity,
    rateLimitHealthCheck
} from "./middleware/rateLimitMonitor.js";
import { apiLogger } from "./middleware/apiLogger.js";

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also handle form data

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

// Apply API logging middleware first
app.use(apiLogger); // Log API calls with details

// Apply rate limiting and monitoring middleware
app.use(addRateLimitHeaders); // Add rate limit headers
app.use(logRequest); // Log requests for analysis
app.use(detectSuspiciousActivity); // Detect suspicious patterns
app.use(burstProtection); // Protect against sudden spikes
app.use(generalRateLimit); // General rate limiting
app.use(speedLimiter); // Progressive slowdown
app.use(rateLimitInfo); // Add rate limit info to logs (dev only)

// Routes with specific rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/execute', codeExecutionRateLimit, executeRoutes);
app.use('/api/search', searchRateLimit, searchRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRateLimit, adminRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Rate limiting status endpoint
app.get('/api/rate-limit-status', rateLimitHealthCheck);

// API logging status endpoint
app.get('/api/logging-status', (req, res) => {
    res.status(200).json({
        logging: 'active',
        message: 'API requests are being logged with method, URL, status code, and response time',
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
    
    // Initialize ranking system
    await initializeRankingSystem();
    
    // Initialize contest scheduler
    await initializeContestScheduler();
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