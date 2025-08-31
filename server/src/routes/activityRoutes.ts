import express from "express"

const router = express.Router();

router.get('/:id');
router.get('/:id/recent');

export default router;