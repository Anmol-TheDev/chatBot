import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError.js';
import { verifyToken, type TokenPayload } from '../utils/jwt.js';

interface AuthenticatedRequest extends Request {
  admin?: TokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access denied. No token provided or invalid format', 401));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using centralized utility
    const decoded = verifyToken(token);
    
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