import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { executeCode } from '../controllers/executeControllers.js';

const router = Router();

// Execute code
router.post('/', authenticate, executeCode);

export default router;