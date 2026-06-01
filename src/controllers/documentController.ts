import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import DocumentModel from '../models/Document.js';
import TextChunkModel from '../models/TextChunk.js';
import { TextExtractionService } from '../services/textExtraction.js';
import { CloudinaryService } from '../services/cloudinaryService.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

interface UploadRequest extends Request {
  file?: Express.Multer.File & {
    path: string;
    filename: string;
  };
}

export const uploadDocument: RequestHandler = catchAsync(async (req: UploadRequest, res: Response, next: NextFunction): Promise<void> => {
  // Check if Cloudinary is properly configured
  if (!isCloudinaryConfigured()) {
    return next(new AppError('File upload is currently unavailable. Cloudinary configuration is incomplete.', 503));
  }

  // Check if file was uploaded
  if (!req.file) {
    return next(new AppError('No file uploaded. Please select a file to upload.', 400));
  }

  const { file } = req;
  
  try {
    // Get file type
    const fileType = TextExtractionService.getFileType(file.originalname);
    
    // Extract text and create chunks
    const extractionResult = await TextExtractionService.extractTextAndChunk(
      file.path, // Cloudinary URL
      fileType,
      file.originalname
    );
    
    // Create document record in database
    const document = await DocumentModel.create({
      fileName: file.originalname,
      fileType: fileType,
      filePath: file.path, // Cloudinary URL
      cloudinaryId: file.filename, // Cloudinary public_id
      extractedText: extractionResult.fullText
    });

    // Save text chunks to database
    const chunkPromises = extractionResult.chunks.map((chunk, index) => 
      TextChunkModel.create({
        documentId: document._id,
        chunkIndex: index,
        content: chunk.content,
        wordCount: chunk.wordCount,
        metadata: {
          startPosition: chunk.startPosition,
          endPosition: chunk.endPosition,
          pageNumber: chunk.pageNumber
        }
      })
    );

    const savedChunks = await Promise.all(chunkPromises);

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded and processed successfully',
      data: {
        document: {
          id: document._id,
          fileName: document.fileName,
          fileType: document.fileType,
          filePath: document.filePath,
          extractedText: document.extractedText.substring(0, 200) + (document.extractedText.length > 200 ? '...' : ''),
          uploadedAt: document.uploadedAt,
          chunksCreated: savedChunks.length,
          totalWords: extractionResult.metadata.wordCount,
          processingTime: extractionResult.metadata.processingTime,
          extractionMethod: extractionResult.metadata.extractionMethod,
          metadata: extractionResult.metadata
        }
      }
    });
  } catch (error) {
    console.error('Document processing error:', error);
    
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

  // Get chunk counts for each document
  const documentsWithStats = await Promise.all(
    documents.map(async (doc) => {
      const chunkCount = await TextChunkModel.countDocuments({ documentId: doc._id });
      return {
        ...doc.toObject(),
        chunkCount
      };
    })
  );

  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: {
      documents: documentsWithStats
    }
  });
});

export const getDocument: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const document = await DocumentModel.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  // Get associated chunks
  const chunks = await TextChunkModel.find({ documentId: id })
    .sort({ chunkIndex: 1 })
    .select('chunkIndex content wordCount metadata');

  res.status(200).json({
    status: 'success',
    data: {
      document: {
        ...document.toObject(),
        chunks
      }
    }
  });
});

export const deleteDocument: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  
  const document = await DocumentModel.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  // Delete associated text chunks
  await TextChunkModel.deleteMany({ documentId: id });

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