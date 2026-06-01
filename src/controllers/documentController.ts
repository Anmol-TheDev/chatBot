import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import DocumentModel from '../models/Document.js';
import { TextExtractionService } from '../services/textExtraction.js';
import { CloudinaryService } from '../services/cloudinaryService.js';

interface UploadRequest extends Request {
  file?: Express.Multer.File & {
    path: string;
    filename: string;
  };
}

export const uploadDocument: RequestHandler = catchAsync(async (req: UploadRequest, res: Response, next: NextFunction): Promise<void> => {
  // Check if file was uploaded
  if (!req.file) {
    return next(new AppError('No file uploaded. Please select a file to upload.', 400));
  }

  const { file } = req;
  
  try {
    // Get file type
    const fileType = TextExtractionService.getFileType(file.originalname);
    
    // Extract text from the uploaded file using Cloudinary URL
    const extractedText = await TextExtractionService.extractText(
      file.path, // This is now the Cloudinary URL
      fileType,
      file.originalname
    );
    
    // Create document record in database
    const document = await DocumentModel.create({
      fileName: file.originalname,
      fileType: fileType,
      filePath: file.path, // Cloudinary URL
      cloudinaryId: file.filename, // Cloudinary public_id
      extractedText: extractedText
    });

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        document: {
          id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          filePath: document.filePath, // Cloudinary URL
          extractedText: document.extractedText.substring(0, 200) + (document.extractedText.length > 200 ? '...' : ''), // Preview only
          uploadedAt: document.uploadedAt
        }
      }
    });
  } catch (error) {
    // If database save fails, clean up the uploaded file from Cloudinary
    try {
      await CloudinaryService.deleteFile(file.filename);
    } catch (cleanupError) {
      console.error('Error cleaning up Cloudinary file:', cleanupError);
    }
    
    return next(new AppError('Failed to process uploaded document', 500));
  }
});

export const getDocuments: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const documents = await DocumentModel.find()
    .select('-extractedText') // Exclude full text for list view
    .sort({ uploadedAt: -1 });

  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: {
      documents
    }
  });
});

export const getDocument: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const document = await DocumentModel.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      document
    }
  });
});

export const deleteDocument: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const document = await DocumentModel.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  // Delete the file from Cloudinary
  try {
    await CloudinaryService.deleteFile(document.cloudinaryId);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    // Continue with database deletion even if Cloudinary deletion fails
  }

  // Delete from database
  await DocumentModel.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});