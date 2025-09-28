import { Router } from 'express';
import { getLanguages, getLanguageById } from '../controllers/languageControllers.js';

const router = Router();

// Get all languages
router.get('/', getLanguages);

// Get language by ID
router.get('/:id', getLanguageById);

export default router;