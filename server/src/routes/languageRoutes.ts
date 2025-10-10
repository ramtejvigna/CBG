import { Router } from 'express';
import { addLanguage, getLanguages } from '../controllers/languageControllers.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getLanguages);
router.post('/', authenticateAdmin, addLanguage);

export default router;