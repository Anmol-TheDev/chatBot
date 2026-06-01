import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import globalErrorHandler from './middleware/errorHandler.js';
import { handleMulterError } from './middleware/multerErrorHandler.js';
import AppError from './utils/AppError.js';
import { corsConfig } from './config/env.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';
import { GeminiService } from './services/geminiService.js';

// Import routes
import adminRoutes from './routes/adminRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Create Express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost or 127.0.0.1 origin
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Check against configured CORS_ORIGIN
    if (origin === corsConfig.CORS_ORIGIN) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    services: {
      cloudinary: isCloudinaryConfigured() ? 'configured' : 'not configured',
      geminiAI: GeminiService.isAvailable() ? 'configured' : 'not configured'
    }
  });
});

// Handle undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Multer error handling middleware
app.use(handleMulterError);

// Global error handling middleware
app.use(globalErrorHandler);

export default app;