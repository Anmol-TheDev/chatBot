# ChatBot API - Bruno Collection

This Bruno collection contains all the API endpoints for the ChatBot application with example payloads and comprehensive documentation.

## Setup

1. **Install Bruno**: Download from [Bruno's official website](https://www.usebruno.com/)

2. **Open Collection**: 
   - Open Bruno
   - Click "Open Collection"
   - Select the `bruno-collection` folder

3. **Configure Environment**:
   - Select "Local" environment
   - Update the `baseUrl` if your server runs on a different port
   - The `adminToken` will be automatically set after running the "Admin Login" request

## Environment Variables

The collection uses the following environment variables:

- `baseUrl`: Base URL of the API (default: http://localhost:3000)
- `adminToken`: JWT token for admin authentication (auto-populated after login)

## API Endpoints

### 1. Health Check
- **Method**: GET
- **URL**: `/health`
- **Auth**: None
- **Description**: Check server health status

### 2. Admin Login
- **Method**: POST
- **URL**: `/api/admin/login`
- **Auth**: None
- **Body**: JSON with email and password
- **Description**: Authenticate admin and get JWT token

### 3. Upload Document
- **Method**: POST
- **URL**: `/api/documents/upload`
- **Auth**: Bearer Token
- **Body**: Multipart form with document file
- **Description**: Upload document to Cloudinary storage

### 4. Get All Documents
- **Method**: GET
- **URL**: `/api/documents`
- **Auth**: Bearer Token
- **Description**: Retrieve list of all documents

### 5. Get Document by ID
- **Method**: GET
- **URL**: `/api/documents/:id`
- **Auth**: Bearer Token
- **Description**: Get specific document with full extracted text

### 6. Delete Document
- **Method**: DELETE
- **URL**: `/api/documents/:id`
- **Auth**: Bearer Token
- **Description**: Delete document from database and Cloudinary

### 7. Create Q&A
- **Method**: POST
- **URL**: `/api/qa`
- **Auth**: Bearer Token
- **Body**: JSON with question and answer
- **Description**: Create new question-answer pair

### 8. Delete Q&A
- **Method**: DELETE
- **URL**: `/api/qa/:id`
- **Auth**: Bearer Token
- **Description**: Delete specific Q&A pair

## Usage Instructions

1. **Start with Health Check**: Verify the server is running
2. **Admin Login**: Run the login request to get authentication token
3. **Use Protected Endpoints**: The token will be automatically used for authenticated requests
4. **File Upload**: For document upload, replace the file path in the multipart form with your actual file

## Authentication Flow

1. Call `Admin Login` with credentials
2. The response token is automatically stored in `adminToken` environment variable
3. All subsequent requests use this token for authentication

## File Upload Notes

- Supported formats: PDF, DOC, DOCX, TXT, MD
- Maximum file size: 10MB
- Files are stored on Cloudinary
- Text extraction is performed automatically (basic implementation for TXT/MD files)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "fail",
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Testing

Each request includes test scripts that:
- Verify response status codes
- Check response structure
- Validate required fields
- Store tokens for subsequent requests

Run the entire collection to test all endpoints sequentially.