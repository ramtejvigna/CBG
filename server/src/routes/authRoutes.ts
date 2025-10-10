import express from "express"
import { googleAuth, login, signup, logout, completeOnboarding, me } from "../controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.post('/google', googleAuth);
router.post('/complete-onboarding', completeOnboarding);
router.get('/me', authenticate, me);

export default router;