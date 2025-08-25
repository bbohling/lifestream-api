import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import ingestRoutes from './routes/ingest.js';
import reportsRoutes from './routes/reports.js';
import komsRoutes from './routes/koms.js';
import retransformRoutes from './routes/retransform.js';
import bulksyncRoutes from './routes/bulksync.js';
import limitsRoutes from './routes/limits.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Initialize Express app
const app = express();

// Initialize Prisma only if not in test environment or if DATABASE_URL is available
let prisma = null;
if (process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
  } catch (error) {
    logger.warn('Prisma initialization skipped:', error.message);
  }
}

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: NODE_ENV === 'development' ? [/^http:\/\/localhost:\d+$/] : CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API routes
app.use('/v1/ingest', ingestRoutes);
app.use('/v1/reports', reportsRoutes);
app.use('/v1/koms', komsRoutes);
app.use('/v1/retransform', retransformRoutes);
app.use('/v1/bulksync', bulksyncRoutes);
app.use('/v1/limits', limitsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
