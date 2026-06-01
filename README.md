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

### Admin Authentication
- `POST /api/admin/login` - Admin login (returns JWT token)

### Documents (Protected - Admin Only)
- `POST /api/documents/upload` - Upload document (requires admin token)
- `GET /api/documents` - Get all documents (requires admin token)
- `GET /api/documents/:id` - Get document by ID (requires admin token)
- `DELETE /api/documents/:id` - Delete document (requires admin token)

### Q&A (Protected - Admin Only)
- `POST /api/qa` - Create Q&A pair (requires admin token)
- `DELETE /api/qa/:id` - Delete Q&A pair (requires admin token)

### Health Check
- `GET /health` - Server health status

## Document Upload

### Upload a Document
```bash
POST /api/documents/upload
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data

Form Data:
- document: [file] (PDF, DOC, DOCX, TXT, MD)
```

**Supported File Types:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Text files (.txt)
- Markdown (.md)

**File Size Limit:** 10MB
**Storage:** Files are stored securely on Cloudinary

**Response:**
```json
{
  "status": "success",
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": "document_id",
      "fileName": "example.pdf",
      "fileType": "pdf",
      "filePath": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/chatbot-documents/document-123456789.pdf",
      "extractedText": "Preview of extracted text...",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the dashboard
3. Update your `.env` file:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/chatbot |
| ADMIN_EMAIL | Admin email for login | admin@example.com |
| ADMIN_PASSWORD | Admin password for login | 123456 |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| CORS_ORIGIN | CORS origin | http://localhost:3000 |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | - |
| CLOUDINARY_API_KEY | Cloudinary API key | - |
| CLOUDINARY_API_SECRET | Cloudinary API secret | - |

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript