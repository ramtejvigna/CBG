import { Router } from 'express';
import { createContest, registerForContest, getUpcomingContests, getContestDetails } from '../controllers/contestControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Contest routes
router.post('/create', authenticate, createContest);
router.post('/:contestId/register', authenticate, registerForContest);
router.get('/upcoming', getUpcomingContests);
router.get('/:contestId', getContestDetails);

export default router;
