import { Router } from 'express';
import {
    getChallengeById,
    getChallengeBySlug,
    getChallengesByFilter,
    getChallengeSubmissions,
    createChallenge,
    updateChallenge,
    getHomePageChallenges,
    likeChallengeToggle,
    getChallengeStats
} from '../controllers/challengeControllers.js';
import { authenticate, authenticateAdmin, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/home', getHomePageChallenges);
router.get('/', getChallengesByFilter);
router.get('/slug/:slug', getChallengeBySlug);
router.get('/submissions', getChallengeSubmissions); // For query param based submissions
router.get('/:id', getChallengeById);
router.get('/:id/submissions', getChallengeSubmissions);
router.get('/:id/stats', optionalAuthenticate, getChallengeStats);

// Protected routes
router.post('/', authenticateAdmin, createChallenge);
router.put('/:id', authenticateAdmin, updateChallenge);
router.post('/:id/like', authenticate, likeChallengeToggle);

export default router;