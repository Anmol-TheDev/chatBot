import { v2 as cloudinary } from 'cloudinary';

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Cloudinary configuration missing:');
    console.error('- CLOUDINARY_CLOUD_NAME:', cloud_name ? '✅' : '❌ Missing');
    console.error('- CLOUDINARY_API_KEY:', api_key ? '✅' : '❌ Missing');
    console.error('- CLOUDINARY_API_SECRET:', api_secret ? '✅' : '❌ Missing');
    throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
  }
  
  console.log('✅ Cloudinary configuration validated');
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate configuration on startup
try {
  validateCloudinaryConfig();
} catch (error) {
  console.error('Cloudinary configuration error:', error);
}

export default cloudinary;