import { Router } from 'express';
import { adminLogin, registerAdmin } from '../controllers/adminControllers.js';

const router = Router();

router.post('/register', registerAdmin);
router.post('/login', adminLogin);

export default router;