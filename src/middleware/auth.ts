import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

interface AuthenticatedRequest extends Request {
  admin?: {
    email: string;
    role: string;
    iat: number;
  };
}

interface JwtPayload {
  email: string;
  role: string;
  iat: number;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access denied. No token provided or invalid format', 401));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError('Server configuration error', 500));
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return next(new AppError('Access denied. Admin privileges required', 403));
    }

    // Add admin info to request object
    req.admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }

    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new AppError('Access denied. Authentication required', 401));
    }

    if (!roles.includes(req.admin.role)) {
      return next(new AppError('Access denied. Insufficient privileges', 403));
    }

    next();
  };
};