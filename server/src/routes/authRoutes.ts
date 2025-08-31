import express from "express"

const router = express.Router();

router.post('/login');
router.post('/signup');
router.post('/logout');

export default router;