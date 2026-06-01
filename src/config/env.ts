import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment configuration interface
export interface EnvConfig {
  // Server Configuration
  PORT: number;
  NODE_ENV: string;
  SHOW_STACK_TRACE: boolean;

  // Database Configuration
  MONGODB_URI: string;

  // Admin Credentials
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;

  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS Configuration
  CORS_ORIGIN: string;

  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

// Validate and parse environment variables
const validateEnv = (): EnvConfig => {
  const errors: string[] = [];

  // Helper function to get required env var
  const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      errors.push(`${key} is required but not provided`);
      return '';
    }
    return value;
  };

  // Helper function to get optional env var with default
  const getOptionalEnv = (key: string, defaultValue: string): string => {
    return process.env[key] || defaultValue;
  };

  // Helper function to get boolean env var
  const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  };

  // Helper function to get number env var
  const getNumberEnv = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      errors.push(`${key} must be a valid number`);
      return defaultValue;
    }
    return parsed;
  };

  const config: EnvConfig = {
    // Server Configuration
    PORT: getNumberEnv('PORT', 3000),
    NODE_ENV: getOptionalEnv('NODE_ENV', 'development'),
    SHOW_STACK_TRACE: getBooleanEnv('SHOW_STACK_TRACE', false),

    // Database Configuration
    MONGODB_URI: getRequiredEnv('MONGODB_URI'),

    // Admin Credentials
    ADMIN_EMAIL: getRequiredEnv('ADMIN_EMAIL'),
    ADMIN_PASSWORD: getRequiredEnv('ADMIN_PASSWORD'),

    // JWT Configuration
    JWT_SECRET: getRequiredEnv('JWT_SECRET'),
    JWT_EXPIRES_IN: getOptionalEnv('JWT_EXPIRES_IN', '7d'),

    // CORS Configuration
    CORS_ORIGIN: getOptionalEnv('CORS_ORIGIN', 'http://localhost:3000'),

    // Cloudinary Configuration (optional for development)
    CLOUDINARY_CLOUD_NAME: getOptionalEnv('CLOUDINARY_CLOUD_NAME', ''),
    CLOUDINARY_API_KEY: getOptionalEnv('CLOUDINARY_API_KEY', ''),
    CLOUDINARY_API_SECRET: getOptionalEnv('CLOUDINARY_API_SECRET', ''),
  };

  // Check for validation errors
  if (errors.length > 0) {
    console.error('❌ Environment validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed. Please check your .env file.');
  }

  // Validate Cloudinary configuration separately (non-fatal)
  const cloudinaryMissing = !config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET;
  if (cloudinaryMissing) {
    console.warn('⚠️  Cloudinary configuration incomplete:');
    console.warn('  - CLOUDINARY_CLOUD_NAME:', config.CLOUDINARY_CLOUD_NAME ? '✅' : '❌ Missing');
    console.warn('  - CLOUDINARY_API_KEY:', config.CLOUDINARY_API_KEY ? '✅' : '❌ Missing');
    console.warn('  - CLOUDINARY_API_SECRET:', config.CLOUDINARY_API_SECRET ? '✅' : '❌ Missing');
    console.warn('  - File upload features will be disabled until Cloudinary is configured.');
  } else {
    console.log('✅ Cloudinary configuration validated');
  }

  console.log('✅ Environment configuration loaded successfully');
  return config;
};

// Export the validated configuration
export const env = validateEnv();

// Export helper to check if Cloudinary is configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
};

// Export individual config sections for convenience
export const serverConfig = {
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  SHOW_STACK_TRACE: env.SHOW_STACK_TRACE,
};

export const dbConfig = {
  MONGODB_URI: env.MONGODB_URI,
};

export const authConfig = {
  ADMIN_EMAIL: env.ADMIN_EMAIL,
  ADMIN_PASSWORD: env.ADMIN_PASSWORD,
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ,
};

export const corsConfig = {
  CORS_ORIGIN: env.CORS_ORIGIN,
};

export const cloudinaryConfig = {
  CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
};