import { Router } from 'express';
import { uploadDocument } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected route - only admin can upload documents
router.post('/upload', authenticate, uploadDocument);

export default router;