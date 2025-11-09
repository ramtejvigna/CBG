import express from "express"
import { googleAuth, login, signup, logout, completeOnboarding, me, forgotPassword, resetPassword, validateResetToken, getSessionToken } from "../controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/optimizedRateLimiter.js";

const router = express.Router();

router.post('/login', authRateLimit, login);
router.post('/signup', authRateLimit, signup);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);
router.post('/validate-reset-token', authRateLimit, validateResetToken);
router.post('/google', authRateLimit, googleAuth);
router.post('/complete-onboarding', authenticate, completeOnboarding);
router.get('/me', authenticate, me);
router.get('/session-token/:userId', getSessionToken);

export default router;