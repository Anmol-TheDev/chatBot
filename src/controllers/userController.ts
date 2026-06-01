import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const users = await User.find();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

export const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const newUser = await User.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    return next(error);
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    return next(error);
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    const error = new Error('User not found') as any;
    error.statusCode = 404;
    return next(error);
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});