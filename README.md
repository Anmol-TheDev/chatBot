# ChatBot API

A TypeScript Express.js application with MongoDB integration.

## Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # MongoDB connection
├── controllers/     # Route controllers
│   └── userController.ts
├── middleware/      # Custom middleware
│   ├── auth.ts      # Authentication middleware
│   ├── errorHandler.ts # Global error handler
│   └── validation.ts # Request validation
├── models/          # MongoDB models
│   └── User.ts      # User model
├── routes/          # Route definitions
│   └── userRoutes.ts
├── services/        # Business logic
│   └── userService.ts
├── uploads/         # File uploads directory
├── utils/           # Utility functions
│   ├── catchAsync.ts # Async error handling
│   └── logger.ts    # Logging utility
├── app.ts           # Express app configuration
├── server.ts        # Server startup
└── index.ts         # Application entry point
```

## Features

- ✅ Express.js with TypeScript
- ✅ MongoDB with Mongoose
- ✅ CORS enabled
- ✅ Environment variables
- ✅ Global error handling
- ✅ Request validation
- ✅ Structured logging
- ✅ RESTful API routes

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your MongoDB connection string

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /health` - Server health status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/chatbot |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| CORS_ORIGIN | CORS origin | http://localhost:3000 |

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript