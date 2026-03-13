import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './prisma/client.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import { conversationStore } from './agent/conversationStore.js';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/users.js';
import { chatRouter } from './routes/chat.js';
import { workoutRouter } from './routes/workouts.js';
import { progressRouter } from './routes/progress.js';
import { telegramRouter } from './routes/telegram.js';
import { telegramInternalRouter } from './routes/telegramInternal.js';

const app = express();

// ── Security & Utilities ──────────────────────────────────────────
app.use(helmet());
app.use(compression({
  filter: (req, res) => {
    // Never compress SSE — it prevents streaming
    if (req.headers.accept === 'text/event-stream') return false;
    return compression.filter(req, res);
  },
}));
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);
app.use(globalLimiter);

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fitness-ai-backend',
    version: '1.0.0',
  });
});

// ── Public Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/telegram', telegramInternalRouter);

// ── Protected Routes ──────────────────────────────────────────────
app.use('/api', authenticate);
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/progress', progressRouter);

// ── Error Handling ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────
async function start() {
  await connectDatabase();
  await conversationStore.connect();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server started on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info('Routes: /api/auth  /api/users  /api/chat  /api/workouts  /api/progress');
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message });
    process.exit(1);
  });
}

start();

export default app;
