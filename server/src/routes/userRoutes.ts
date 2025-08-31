import express from "express"

const router = express.Router();

router.get('/:id/submissions');
router.get('/:id');
router.get('/get-all-users');
router.get('/leaderboard');

export default router;