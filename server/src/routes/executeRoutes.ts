import { Router } from 'express';
import { executeCode } from '../controllers/executeControllers.js';

const router = Router();

// Execute code
router.post('/', executeCode);

export default router;