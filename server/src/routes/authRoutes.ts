import express from "express"
import { googleAuth, login, signup, logout, completeOnboarding, me, forgotPassword, resetPassword, validateResetToken, getSessionToken } from "../controllers/authControllers.js";
import { authenticate } from "../middleware/auth.js";
import { loginRateLimit, passwordResetRateLimit, strictRateLimit } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post('/login', loginRateLimit, login);
router.post('/signup', strictRateLimit, signup);
router.post('/logout', logout);
router.post('/forgot-password', passwordResetRateLimit, forgotPassword);
router.post('/reset-password', passwordResetRateLimit, resetPassword);
router.post('/validate-reset-token', strictRateLimit, validateResetToken);
router.post('/google', loginRateLimit, googleAuth);
router.post('/complete-onboarding', authenticate, completeOnboarding);
router.get('/me', authenticate, me);
router.get('/session-token/:userId', getSessionToken);

export default router;