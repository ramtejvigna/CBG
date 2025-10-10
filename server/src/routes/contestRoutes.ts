import { Router } from 'express';
import { createContest, registerForContest, getUpcomingContests, getContestDetails, submitToContest, getContests } from '../controllers/contestControllers.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Contest routes
router.get('/', authenticateAdmin, getContests);
router.post('/create', authenticateAdmin, createContest);
router.post('/:contestId/register', authenticate, registerForContest);
router.post('/submit', authenticate, submitToContest);
router.get('/upcoming', getUpcomingContests);
router.get('/:contestId', getContestDetails);

export default router;
