import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory
} from '../controllers/categoryControllers.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticateAdmin, createCategory);

export default router;