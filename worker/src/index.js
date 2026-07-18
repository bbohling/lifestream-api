import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { createServices } from './services/index.js';
import { logger } from './utils/logger.js';

import ingestRoutes from './routes/ingest.js';
import ensureFreshRoutes from './routes/ensureFresh.js';
import reportsRoutes from './routes/reports.js';
import komsRoutes from './routes/koms.js';
import retransformRoutes from './routes/retransform.js';
import bulksyncRoutes from './routes/bulksync.js';
import limitsRoutes from './routes/limits.js';

// The Worker serves brndn.me/api/* (Caddy used to strip the /api prefix
// before proxying to Express; here the route delivers the full path).
const app = new Hono().basePath('/api');

// Per-request service graph on context (D1-backed Prisma + Strava client).
app.use('*', async (c, next) => {
  c.set('services', createServices(c.env));
  await next();
});

// CORS mirrors the Express config: same-origin UI plus localhost dev servers.
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
      return 'https://brndn.me';
    },
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production',
  })
);

// API routes
app.route('/v1/ingest', ingestRoutes);
app.route('/v1/ensure-fresh', ensureFreshRoutes);
app.route('/v1/reports', reportsRoutes);
app.route('/v1/koms', komsRoutes);
app.route('/v1/retransform', retransformRoutes);
app.route('/v1/bulksync', bulksyncRoutes);
app.route('/v1/limits', limitsRoutes);

// 404 handler — same shape as the Express app. Express saw paths with /api
// already stripped by Caddy, so strip the basePath here for parity.
app.notFound((c) => {
  const path = c.req.path.replace(/^\/api/, '') || '/';
  return c.json({ error: 'Route not found', path }, 404);
});

// Error handling — same mapping as the Express errorHandler middleware.
app.onError((err, c) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database Error';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Don't expose error details in production
  return c.json({ error: message }, statusCode);
});

export default app;
