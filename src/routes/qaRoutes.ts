import { Router } from 'express';
import { createQA, deleteQA } from '../controllers/qaController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected routes - only admin can create and delete QA
router.post('/', authenticate, createQA);
router.delete('/:id', authenticate, deleteQA);

export default router;