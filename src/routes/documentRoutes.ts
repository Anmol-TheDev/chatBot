import { Router, type IRouter } from 'express';
import { uploadDocument, getDocuments, getDocument, deleteDocument } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router: IRouter = Router();

// Protected routes - only admin can manage documents
router.post('/upload', authenticate, upload.single('document'), uploadDocument);
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;