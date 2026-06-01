import { Server } from 'http';
import app from './app.js';

const PORT: number = parseInt(process.env.PORT || '3000', 10);

const server: Server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.log('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

export default server;