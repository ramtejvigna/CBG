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
    getCurrentUserImage,
    getUserNotificationSettings,
    updateUserNotificationSettings,
    getUserSecuritySettings,
    updateUserSecuritySettings,
    getUserPreferences,
    updateUserPreferences
} from '../controllers/userControllers.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';
import { generalRateLimit } from '../middleware/optimizedRateLimiter.js';

const router = Router();

// Middleware for larger payloads (specifically for profile updates with images)
const largePayloadParser = express.json({ limit: '10mb' });

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:username', getUserProfile);
router.get('/profile/:username/ranking', getUserRanking);
router.get('/:userId/image', getUserImage);
router.put('/:userId/profile', generalRateLimit, largePayloadParser, updateUserProfile);

// Protected routes
router.get('/submissions', authenticate, getUserSubmissions);
router.get('/me/image', authenticate, getCurrentUserImage);
router.post('/rankings/refresh', authenticate, generalRateLimit, refreshRankings);
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/profile/:username/activity', authenticate, getUserActivity);
router.get('/profile/:username/submissions', authenticate, getUserSubmissionsByUsername);
router.get('/profile/:username/contests', authenticate, getUserContests);

// Settings routes - all protected
router.get('/settings/notifications', authenticate, getUserNotificationSettings);
router.put('/settings/notifications', authenticate, updateUserNotificationSettings);
router.get('/settings/security', authenticate, getUserSecuritySettings);
router.put('/settings/security', authenticate, updateUserSecuritySettings);
router.get('/settings/preferences', authenticate, getUserPreferences);
router.put('/settings/preferences', authenticate, updateUserPreferences);

export default router;