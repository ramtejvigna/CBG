import { Router } from 'express';
import { 
    adminLogin, 
    registerAdmin, 
    getAdminProfile,
    getAllUsersAdmin,
    updateUser,
    banUser,
    deleteUser,
    getAllChallengesAdmin,
    getChallengeStatsAdmin,
    deleteChallengeAdmin,
    getAllContestsAdmin,
    getContestStatsAdmin,
    updateContestAdmin,
    deleteContestAdmin,
    getDashboardStats,
    getRecentActivities,
    getSystemStatus
} from '../controllers/adminControllers.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Public admin routes
router.post('/register', registerAdmin);
router.post('/login', adminLogin);

// Protected admin routes
router.get('/profile', authenticateAdmin, getAdminProfile);

// Dashboard
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);
router.get('/dashboard/activities', authenticateAdmin, getRecentActivities);
router.get('/dashboard/system-status', authenticateAdmin, getSystemStatus);

// User management
router.get('/users', authenticateAdmin, getAllUsersAdmin);
router.put('/users/:userId', authenticateAdmin, updateUser);
router.patch('/users/:userId/ban', authenticateAdmin, banUser);
router.delete('/users/:userId', authenticateAdmin, deleteUser);

// Challenge management
router.get('/challenges', authenticateAdmin, getAllChallengesAdmin);
router.get('/challenges/stats', authenticateAdmin, getChallengeStatsAdmin);
router.delete('/challenges/:challengeId', authenticateAdmin, deleteChallengeAdmin);

// Contest management
router.get('/contests', authenticateAdmin, getAllContestsAdmin);
router.get('/contests/stats', authenticateAdmin, getContestStatsAdmin);
router.put('/contests/:contestId', authenticateAdmin, updateContestAdmin);
router.delete('/contests/:contestId', authenticateAdmin, deleteContestAdmin);

export default router;