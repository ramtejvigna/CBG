import { Router } from 'express';
import { globalSearch } from '../controllers/searchControllers.js';

const router = Router();

// Search route
router.get('/', globalSearch);

export default router;