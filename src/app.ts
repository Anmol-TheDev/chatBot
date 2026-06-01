import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import globalErrorHandler from './middleware/errorHandler.js';

// Import routes
import adminRoutes from './routes/adminRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import qaRoutes from './routes/qaRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qa', qaRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Handle undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;