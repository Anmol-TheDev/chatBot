import { Request, Response, NextFunction } from 'express';

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required') as any;
    error.statusCode = 400;
    return next(error);
  }
  
  // Basic email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Please provide a valid email') as any;
    error.statusCode = 400;
    return next(error);
  }
  
  // Password length validation
  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters') as any;
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};