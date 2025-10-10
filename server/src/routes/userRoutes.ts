import { Router } from 'express';
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
    updateUserProfile
} from '../controllers/userControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:username', getUserProfile);
router.get('/profile/:username/ranking', getUserRanking);
router.put('/:userId/profile', updateUserProfile);

// Protected routes
router.get('/submissions', authenticate, getUserSubmissions);
router.post('/rankings/refresh', authenticate, refreshRankings);
router.get('/users', authenticate, getAllUsers);
router.get('/profile/:username/activity', authenticate, getUserActivity);
router.get('/profile/:username/submissions', authenticate, getUserSubmissionsByUsername);
router.get('/profile/:username/contests', authenticate, getUserContests);

export default router;