import { Router } from 'express';
import express from 'express';
import {
    getUserSubmissions,
    getUserSubmissionsByUsername,
    getUserProfile,
    getUserActivity,
    getUserContests,
    getAllUsers,
    getLeaderboard,
    getUserRanking,
    refreshRankings,
    updateUserProfile,
    getUserImage,
    getCurrentUserImage
} from '../controllers/userControllers.js';
import { authenticate } from '../middleware/auth.js';
import { fileUploadRateLimit, createProgressiveRateLimit } from '../middleware/rateLimiter.js';

const router = Router();

// Middleware for larger payloads (specifically for profile updates with images)
const largePayloadParser = express.json({ limit: '10mb' });

// Progressive rate limiting based on user type
const progressiveRateLimit = createProgressiveRateLimit(50);

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:username', getUserProfile);
router.get('/profile/:username/ranking', getUserRanking);
router.get('/:userId/image', getUserImage);
router.put('/:userId/profile', fileUploadRateLimit, largePayloadParser, updateUserProfile);

// Protected routes
router.get('/submissions', authenticate, getUserSubmissions);
router.get('/me/image', authenticate, getCurrentUserImage);
router.post('/rankings/refresh', authenticate, progressiveRateLimit, refreshRankings);
router.get('/users', authenticate, getAllUsers);
router.get('/profile/:username/activity', authenticate, getUserActivity);
router.get('/profile/:username/submissions', authenticate, getUserSubmissionsByUsername);
router.get('/profile/:username/contests', authenticate, getUserContests);

export default router;