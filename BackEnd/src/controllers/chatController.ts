import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { QuestionAnsweringService } from '../services/questionAnsweringService.js';
import { GeminiService } from '../services/geminiService.js';

interface ChatRequest extends Request {
  body: {
    question: string;
  };
}

export const askQuestion: RequestHandler = catchAsync(async (req: ChatRequest, res: Response, next: NextFunction): Promise<void> => {
  const { question } = req.body;
  
  if (!question || question.trim().length === 0) {
    return next(new AppError('Question is required', 400));
  }

  if (question.length > 500) {
    return next(new AppError('Question is too long. Maximum 500 characters allowed.', 400));
  }

  // Get answer from the question answering service (now AI-enhanced)
  const result = await QuestionAnsweringService.answerQuestion(question.trim());

  res.status(200).json({
    status: 'success',
    data: {
      question: question.trim(),
      answer: result.answer,
      confidence: result.confidence,
      type: result.type,
      sources: result.sources,
      aiGenerated: result.aiGenerated || false,
      aiAvailable: GeminiService.isAvailable(),
      suggestedQuestions: result.suggestedQuestions || [],
      timestamp: new Date().toISOString()
    }
  });
});

export const getSimilarQuestions: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit as string) || 3;
  
  if (!q) {
    return next(new AppError('Query parameter "q" is required', 400));
  }

  const similarQuestions = await QuestionAnsweringService.getSimilarQuestions(q as string, limit);

  res.status(200).json({
    status: 'success',
    results: similarQuestions.length,
    data: {
      similarQuestions
    }
  });
});

export const getKnowledgeBaseStats: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const stats = await QuestionAnsweringService.getKnowledgeBaseStats();

  res.status(200).json({
    status: 'success',
    data: {
      knowledgeBase: stats
    }
  });
});
export const testAI: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const testResult = await GeminiService.testConnection();

  res.status(testResult.success ? 200 : 503).json({
    status: testResult.success ? 'success' : 'error',
    data: {
      aiAvailable: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString()
    }
  });
});