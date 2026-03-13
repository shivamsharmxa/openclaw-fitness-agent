import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { runFitnessAgent, streamFitnessAgent, clearConversation } from '../agent/fitnessAgent.js';
import { prisma } from '../prisma/client.js';
import { logger } from '../config/logger.js';

export const chatValidators = {
  send: validate([
    body('message').trim().notEmpty().isLength({ max: 2000 }),
  ]),
};

export const ChatController = {
  async send(req, res, next) {
    try {
      const { message } = req.body;
      const userId = req.user.id;
      const wantsStream = req.headers.accept?.includes('text/event-stream');

      if (wantsStream) {
        // Disable Nagle algorithm so small SSE chunks flush immediately
        req.socket?.setNoDelay(true);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
        res.flushHeaders();

        const sseWrite = (data) => {
          res.write(data);
          // Flush gzip buffer if compression is somehow still active
          if (typeof res.flush === 'function') res.flush();
        };

        try {
          const gen = streamFitnessAgent({ userId, message, channel: 'web' });

          for await (const chunk of gen) {
            sseWrite(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
          sseWrite('data: [DONE]\n\n');
        } catch (streamErr) {
          logger.error('SSE stream error', { error: streamErr.message });
          const msg = streamErr.message ?? '';
          const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit') || msg.includes('Too Many');
          const errMsg = isRateLimit
            ? 'Rate limit reached. Please wait a moment and try again.'
            : 'Something went wrong. Please try again.';
          sseWrite(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
          sseWrite('data: [DONE]\n\n');
        } finally {
          res.end();
        }
        return;
      }

      const response = await runFitnessAgent({ userId, message, channel: 'web' });
      res.json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;

      const [logs, total] = await Promise.all([
        prisma.conversationLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            userMessage: true,
            agentResponse: true,
            toolsUsed: true,
            channel: true,
            createdAt: true,
          },
        }),
        prisma.conversationLog.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: { logs: logs.reverse(), total, hasMore: offset + limit < total },
      });
    } catch (err) {
      next(err);
    }
  },

  async clearHistory(req, res, next) {
    try {
      const userId = req.user.id;
      await Promise.all([
        clearConversation(userId),
        prisma.conversationLog.deleteMany({ where: { userId } }),
      ]);
      res.json({ success: true, message: 'Conversation cleared' });
    } catch (err) {
      next(err);
    }
  },
};
