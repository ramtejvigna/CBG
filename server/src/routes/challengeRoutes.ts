import { Router } from 'express';
import {
    getChallengeById,
    getChallengesByFilter,
    getChallengeSubmissions,
    createChallenge,
    updateChallenge
} from '../controllers/challengeControllers.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/:id', getChallengeById);
router.get('/', getChallengesByFilter);
router.get('/:id/submissions', getChallengeSubmissions);

// Protected routes
router.post('/', authenticate, createChallenge);
router.put('/:id', authenticate, updateChallenge);

export default router;