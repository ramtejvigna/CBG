import { Router } from 'express';
import {
    getUserSubmissions,
    getUserSubmissionsByUsername,
    getUserDetails,
    getUserProfile,
    getUserActivity,
    getUserContests,
    getAllUsers,
    getLeaderboard,
    getUserRanking,
    refreshRankings
} from '../controllers/userControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/users', getAllUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:username', getUserProfile);
router.get('/profile/:username/activity', getUserActivity);
router.get('/profile/:username/submissions', getUserSubmissionsByUsername);
router.get('/profile/:username/contests', getUserContests);
router.get('/profile/:username/ranking', getUserRanking);
router.get('/:userId', getUserDetails);

// Protected routes
router.get('/submissions', authenticate, getUserSubmissions);
router.post('/rankings/refresh', authenticate, refreshRankings);

export default router;