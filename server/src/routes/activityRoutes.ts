import { Router } from 'express';
import {
    getOverallUserActivity,
    getRecentUserActivity
} from '../controllers/activityControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getOverallUserActivity);
router.get('/recent', authenticate, getRecentUserActivity);

export default router;