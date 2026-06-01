import { Router, type IRouter } from 'express';
import { askQuestion, getSimilarQuestions, getKnowledgeBaseStats } from '../controllers/chatController.js';

const router: IRouter = Router();

// Public routes - anyone can ask questions
router.post('/ask', askQuestion);
router.get('/similar', getSimilarQuestions);

// Public route for knowledge base stats
router.get('/stats', getKnowledgeBaseStats);

export default router;