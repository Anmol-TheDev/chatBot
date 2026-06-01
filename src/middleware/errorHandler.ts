import type { Request, Response, NextFunction } from 'express';
import { serverConfig } from '../config/env.js';

interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const globalErrorHandler = (
  err: CustomError | string,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle string errors (like Cloudinary errors)
  if (typeof err === 'string') {
    const error = new Error(err) as CustomError;
    error.statusCode = 500;
    error.status = 'error';
    err = error;
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: serverConfig.SHOW_STACK_TRACE ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Development error response
  if (serverConfig.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: serverConfig.SHOW_STACK_TRACE ? err.stack : undefined
    });
  } else {
    // Production error response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or unknown error: don't leak error details
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};

export default globalErrorHandler;