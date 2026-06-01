import { Router, type IRouter } from 'express';
import { createQA, getAllQA, getQAById, updateQA, deleteQA, searchQA, getQAStats } from '../controllers/qaController.js';
import { authenticate } from '../middleware/auth.js';

const router: IRouter = Router();

// Protected routes - only admin can manage Q&A
router.post('/', authenticate, createQA);
router.get('/', authenticate, getAllQA);
router.get('/search', authenticate, searchQA);
router.get('/stats', authenticate, getQAStats);
router.get('/:id', authenticate, getQAById);
router.put('/:id', authenticate, updateQA);
router.delete('/:id', authenticate, deleteQA);

export default router;