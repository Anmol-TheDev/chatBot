import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
      const error = new Error('Access denied. No token provided or invalid format') as any;
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      const error = new Error('Server configuration error') as any;
      error.statusCode = 500;
      return next(error);
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      const error = new Error('Access denied. Admin privileges required') as any;
      error.statusCode = 403;
      return next(error);
    }

    // Add admin info to request object
    req.admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      const customError = new Error('Invalid token') as any;
      customError.statusCode = 401;
      return next(customError);
    }
    
    if (error.name === 'TokenExpiredError') {
      const customError = new Error('Token expired') as any;
      customError.statusCode = 401;
      return next(customError);
    }

    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      const error = new Error('Access denied. Authentication required') as any;
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.admin.role)) {
      const error = new Error('Access denied. Insufficient privileges') as any;
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};