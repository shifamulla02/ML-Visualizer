require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Import custom middleware
const requestTracking = require('./middleware/requestTracking');
const { errorHandler } = require('./middleware/errorHandler');
const { validateEnvironment } = require('./middleware/envValidation');
const logger = require('./middleware/logger');

// Validate environment variables before starting
try {
  validateEnvironment();
} catch (error) {
  logger.error('Environment validation failed:', { error: error.message });
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const datasetRoutes = require('./routes/dataset');
const preprocessRoutes = require('./routes/preprocess');
const splitRoutes = require('./routes/split');
const modelRoutes = require('./routes/model');
const experimentRoutes = require('./routes/experiment');

const app = express();
app.set('trust proxy', 1);

// ==================== Security Middleware ====================

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration with security best practices
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS request rejected', { origin });
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting - global limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (relaxed for development)
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});
app.use(globalLimiter);

// Rate limiting for auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for data upload (to prevent abuse)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each user to 20 uploads per hour
  keyGenerator: (req) => req.userId || req.ip,
});

// Request body parsing with size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      requestId: req.requestId,
      key,
      ip: req.ip,
    });
  },
}));

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'filter', 'skip', 'limit'],
}));

// ==================== Request Tracking & Logging ====================
app.use(requestTracking);

// ==================== Static Files ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== Database Connection ====================
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mlviz';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    });
    logger.info('MongoDB connected successfully', { uri: uri.replace(/:[^:]*@/, ':****@') });
  } catch (err) {
    logger.warn('Local MongoDB failed, starting fallback memory server...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      logger.info('Fallback MongoDB Memory Server running');
    } catch (memErr) {
      logger.error('Fatal MongoDB error:', { error: memErr.message });
      process.exit(1);
    }
  }
}
connectDB();

// ==================== Health Check Endpoint ====================
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      connected: isHealthy,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState],
    },
  });
});

// ==================== API Routes ====================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dataset', datasetRoutes);
app.use('/api/preprocess', preprocessRoutes);
app.use('/api/split', splitRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/experiment', experimentRoutes);

// ==================== 404 Handler ====================
app.use((req, res) => {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
  });
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// ==================== Error Handling Middleware ====================
app.use(errorHandler);

// ==================== Server Startup ====================
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
  });
});

// ==================== Graceful Shutdown ====================
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    try {
      await mongoose.disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', { error: error.message });
      process.exit(1);
    }
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    try {
      await mongoose.disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', { error: error.message });
      process.exit(1);
    }
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { reason, promise });
});