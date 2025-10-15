import { Router } from 'express';
import { createContest, registerForContest, getUpcomingContests, getContestDetails, submitToContest, getContests, getRegistrationStatus } from '../controllers/contestControllers.js';
import { authenticate, authenticateAdmin, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Contest routes
router.get('/', optionalAuthenticate, getContests);
router.post('/create', authenticateAdmin, createContest);
router.post('/:contestId/register', authenticate, registerForContest);
router.get('/:contestId/registration-status', authenticate, getRegistrationStatus);
router.post('/submit', authenticate, submitToContest);
router.get('/upcoming', getUpcomingContests);
router.get('/:contestId', getContestDetails);

export default router;
