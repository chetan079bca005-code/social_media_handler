import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config, validateConfig } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import prisma from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { startScheduler } from './services/scheduler.service';

// Validate config
validateConfig();

// Initialize Redis (non-blocking)
getRedisClient();

const app = express();

// Track database readiness
let dbReady = false;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (config.nodeEnv !== 'production') {
      callback(null, true); // Allow all origins in development only
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// ============ Request timeout middleware ============
// Prevents requests from hanging forever if DB is slow
app.use((req, res, next) => {
  // 30s timeout for all API requests (Express level)
  req.setTimeout(30000);
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Request timed out. The database may be waking up — please try again.',
      });
    }
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});

// Stricter limiter for login/register to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts, please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth', authLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Health check endpoint (no auth, no rate limit, fast response)
app.get('/api/health', async (_req, res) => {
  if (dbReady) {
    return res.json({ status: 'ok', db: 'connected', timestamp: Date.now() });
  }
  // If DB not ready, try a quick ping with timeout
  try {
    const pingPromise = prisma.$runCommandRaw({ ping: 1 });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB ping timeout')), 3000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    dbReady = true;
    return res.json({ status: 'ok', db: 'connected', timestamp: Date.now() });
  } catch {
    return res.status(503).json({ status: 'warming', db: 'connecting', timestamp: Date.now() });
  }
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Closing connections...');
  
  await prisma.$disconnect();
  await disconnectRedis();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ============ DB keep-alive (prevents Atlas from sleeping) ============
function startKeepAlive() {
  setInterval(async () => {
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      if (!dbReady) {
        dbReady = true;
        console.log('✅ Database connection restored');
      }
    } catch {
      dbReady = false;
    }
  }, 4 * 60 * 1000); // Ping every 4 minutes
}

// Warm up database connection, then start server
async function startServer() {
  const PORT = config.port;

  // Start listening IMMEDIATELY so frontend requests don't get ECONNREFUSED
  app.listen(PORT, () => {
    // Check Cloudinary config
    const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    console.log(`
🚀 Server running on port ${PORT}
📝 Environment: ${config.nodeEnv}
🌐 Frontend URL: ${config.frontendUrl}
☁️  Cloudinary: ${cloudinaryConfigured ? '✅ Configured (CDN uploads enabled)' : '⚠️  Not configured (using local disk storage)'}
    `);
  });

  // Warm up DB in background (don't block server startup)
  try {
    console.log('⏳ Warming up database connection...');
    await prisma.$connect();
    dbReady = true;
    console.log('✅ Prisma connected to MongoDB');

    // Start background scheduler after DB is ready
    startScheduler();
  } catch (err: any) {
    console.error('⚠️ Database warmup failed (will retry on first request):', err.message);
  }

  // Start keep-alive pings
  startKeepAlive();
}

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
