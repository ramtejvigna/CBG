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
import { initializeRankingSystem, shutdownRankingSystem } from "./lib/rankingScheduler.js";

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also handle form data
app.use(cors());

app.use((req, res, next) => {
    console.log(`${req.method} - ${req.url}`);
    next();
})

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
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
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    shutdownRankingSystem();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    shutdownRankingSystem();
    process.exit(0);
});