import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig, isCloudinaryConfigured } from './env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.CLOUDINARY_CLOUD_NAME,
  api_key: cloudinaryConfig.CLOUDINARY_API_KEY,
  api_secret: cloudinaryConfig.CLOUDINARY_API_SECRET,
});

export { isCloudinaryConfigured };
export default cloudinary;