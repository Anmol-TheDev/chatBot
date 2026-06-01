import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import QAModel from '../models/QA.js';
import { QAService } from '../services/qaService.js';

export const createQA: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { question, answer } = req.body;
  
  if (!question || !answer) {
    return next(new AppError('Question and answer are required', 400));
  }

  // Check if question already exists
  const existingQA = await QAModel.findOne({ 
    question: { $regex: new RegExp(`^${question.trim()}$`, 'i') } 
  });
  
  if (existingQA) {
    return next(new AppError('A Q&A with this question already exists', 400));
  }

  const qa = await QAModel.create({
    question: question.trim(),
    answer: answer.trim()
  });

  res.status(201).json({
    status: 'success',
    message: 'Q&A created successfully',
    data: {
      qa
    }
  });
});

export const getAllQA: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Parse query parameters for pagination and search
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (search) {
    query = {
      $or: [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Get total count for pagination
  const total = await QAModel.countDocuments(query);
  
  // Get Q&A pairs with pagination
  const qaPairs = await QAModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: qaPairs.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      qaPairs
    }
  });
});

export const getQAById: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const qa = await QAModel.findById(id);
  
  if (!qa) {
    return next(new AppError('Q&A not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      qa
    }
  });
});

export const updateQA: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { question, answer } = req.body;
  
  if (!question && !answer) {
    return next(new AppError('At least one field (question or answer) is required for update', 400));
  }

  // Check if the Q&A exists
  const existingQA = await QAModel.findById(id);
  if (!existingQA) {
    return next(new AppError('Q&A not found', 404));
  }

  // If updating question, check for duplicates (excluding current record)
  if (question && question.trim() !== existingQA.question) {
    const duplicateQA = await QAModel.findOne({ 
      question: { $regex: new RegExp(`^${question.trim()}$`, 'i') },
      _id: { $ne: id }
    });
    
    if (duplicateQA) {
      return next(new AppError('A Q&A with this question already exists', 400));
    }
  }

  // Update fields
  const updateData: any = {};
  if (question) updateData.question = question.trim();
  if (answer) updateData.answer = answer.trim();

  const qa = await QAModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Q&A updated successfully',
    data: {
      qa
    }
  });
});

export const deleteQA: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const qa = await QAModel.findByIdAndDelete(id);
  
  if (!qa) {
    return next(new AppError('Q&A not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

export const searchQA: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit as string) || 5;
  
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }

  const results = await QAService.searchQA(q as string, limit);

  res.status(200).json({
    status: 'success',
    results: results.length,
    data: {
      qaPairs: results
    }
  });
});

export const getQAStats: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const stats = await QAService.getQAStats();

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});