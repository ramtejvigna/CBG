import { Router } from 'express';
import { getPlatformStatistics } from '../controllers/statisticsControllers.js';

const router = Router();

// Public route
router.get('/', getPlatformStatistics);

export default router;
