import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Server settings
  server: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  // AI Services
  ai: {
    apiBaseUrl: process.env.AI_API_BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://api.apifree.ai/v1',
    apiKey: process.env.AI_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    textApiKey: process.env.AI_TEXT_API_KEY || process.env.OPENROUTER_TEXT_API_KEY || '',
    audioApiKey: process.env.AI_AUDIO_API_KEY || process.env.OPENROUTER_AUDIO_API_KEY || '',
    imageApiKey: process.env.AI_IMAGE_API_KEY || process.env.OPENROUTER_IMAGE_API_KEY || '',
    textModel: process.env.AI_TEXT_MODEL || 'anthropic/claude-3.5-sonnet',
    imageModel: process.env.AI_IMAGE_MODEL || 'google/nano-banana-pro/edit',
    audioModel: process.env.AI_AUDIO_MODEL || 'openai/whisper-1',
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-32chars!',
  
  // OAuth Credentials
  oauth: {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackUrl: process.env.FACEBOOK_CALLBACK_URL || '',
    },
    instagram: {
      appId: process.env.INSTAGRAM_APP_ID || '',
      appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    },
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      callbackUrl: process.env.TWITTER_CALLBACK_URL || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackUrl: process.env.LINKEDIN_CALLBACK_URL || '',
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      callbackUrl: process.env.TIKTOK_CALLBACK_URL || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    },
    pinterest: {
      appId: process.env.PINTEREST_APP_ID || '',
      appSecret: process.env.PINTEREST_APP_SECRET || '',
      callbackUrl: process.env.PINTEREST_CALLBACK_URL || '',
    },
    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.YOUTUBE_CALLBACK_URL || '',
    },
    threads: {
      appId: process.env.THREADS_APP_ID || process.env.INSTAGRAM_APP_ID || '',
      appSecret: process.env.THREADS_APP_SECRET || process.env.INSTAGRAM_APP_SECRET || '',
      callbackUrl: process.env.THREADS_CALLBACK_URL || '',
    },
  },
};

// Validate required config
export function validateConfig(): void {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
  }
}
