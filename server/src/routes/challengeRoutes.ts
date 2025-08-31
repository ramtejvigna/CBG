import express from "express"

const router = express.Router();

router.get('/:id');
router.get('/category');
router.get('/submissions');
router.post('/add');
router.put('/edit');
router.delete('/');

export default router;