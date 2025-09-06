import { Router } from 'express';
import {
    getUserSubmissions,
    getUserDetails,
    getAllUsers,
    getLeaderboard
} from '../controllers/userControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes

router.get('/users', getAllUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/submissions', authenticate, getUserSubmissions);
router.get('/:userId', getUserDetails);

export default router;