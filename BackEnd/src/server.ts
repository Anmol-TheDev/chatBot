import { Server } from 'http';
import app from './app.js';
import { serverConfig } from './config/env.js';

const server: Server = app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Server is running on port ${serverConfig.PORT}`);
  console.log(`📍 Environment: ${serverConfig.NODE_ENV}`);
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