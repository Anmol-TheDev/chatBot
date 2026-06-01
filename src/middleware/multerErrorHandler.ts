import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import AppError from '../utils/AppError.js';

export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Cloudinary configuration errors
  if (typeof err === 'string' && err.includes('api_key')) {
    return next(new AppError('File upload service is not properly configured. Please contact administrator.', 500));
  }

  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size allowed is 10MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Only 1 file allowed at a time';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name. Use "document" as the field name';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the multipart form';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the form';
        break;
      default:
        message = err.message || 'File upload error';
    }

    return next(new AppError(message, statusCode));
  }

  // Handle other Cloudinary errors
  if (err.message && err.message.includes('cloudinary')) {
    return next(new AppError('File upload service error. Please try again later.', 500));
  }

  // If it's not a multer error, pass it to the next error handler
  next(err);
};