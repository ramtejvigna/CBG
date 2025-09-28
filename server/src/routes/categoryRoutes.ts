import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById
} from '../controllers/categoryControllers.js';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

export default router;