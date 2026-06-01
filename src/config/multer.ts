import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';
import AppError from '../utils/AppError.js';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatbot-documents', // Folder name in Cloudinary
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx'], // Allowed file formats
    resource_type: 'raw', // Use 'raw' for non-image files
    public_id: (_req: any, file: Express.Multer.File) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = file.fieldname + '-' + uniqueSuffix;
      return fileName;
    },
  } as any,
});

// File filter function
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx'];
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  
  if (fileExtension && allowedTypes.includes('.' + fileExtension)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file at a time
  }
});

export default upload;