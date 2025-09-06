import express from "express"
import { googleAuth, login, signup, logout, completeOnboarding } from "../controllers/authControllers.js";

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.post('/google', googleAuth);
router.post('/complete-onboarding', completeOnboarding);

export default router;