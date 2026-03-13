/**
 * Conversation Store
 *
 * Abstraction over Redis (production) with automatic in-memory fallback (dev/test).
 * On cold start (Redis miss), history is rebuilt from ConversationLog in Postgres.
 *
 * Key format: chat:history:{userId}
 * TTL: 24 hours
 */

import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { prisma } from '../prisma/client.js';

const MAX_HISTORY_TURNS = 20;   // keep last 20 user+assistant pairs
const TTL_SECONDS = 86400;       // 24 hours

class ConversationStore {
  constructor() {
    this._memory = new Map();   // in-memory fallback
    this._redis = null;
    this._useRedis = false;
  }

  async connect() {
    try {
      const client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't retry — fall back to memory on failure
      });

      // Suppress the unhandled error event that fires on connection loss
      client.on('error', () => {});

      await client.connect();

      this._redis = client;
      this._useRedis = true;
      logger.info('Conversation store: Redis connected');
    } catch (err) {
      logger.warn('Redis unavailable — using in-memory conversation store (not suitable for multi-instance)', {
        error: err.message,
      });
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async get(userId) {
    const key = this._key(userId);

    // 1. Try Redis / memory
    const cached = await this._read(key);
    if (cached) return cached;

    // 2. Cold start — rebuild from DB (fetch newest, reverse for chronological order)
    const logs = await prisma.conversationLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_TURNS,
      select: { userMessage: true, agentResponse: true },
    });
    logs.reverse();

    const history = logs.flatMap(log => [
      { role: 'user',      content: log.userMessage  },
      { role: 'assistant', content: log.agentResponse },
    ]);

    if (history.length > 0) {
      await this._write(key, history);
    }

    return history;
  }

  async set(userId, history) {
    const trimmed = history.slice(-(MAX_HISTORY_TURNS * 2));
    await this._write(this._key(userId), trimmed);
  }

  async delete(userId) {
    const key = this._key(userId);
    if (this._useRedis) {
      await this._redis.del(key).catch(() => {});
    }
    this._memory.delete(key);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  _key(userId) {
    return `chat:history:${userId}`;
  }

  async _read(key) {
    if (this._useRedis) {
      try {
        const raw = await this._redis.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        // Redis error — fall through to memory
      }
    }
    return this._memory.get(key) ?? null;
  }

  async _write(key, data) {
    if (this._useRedis) {
      try {
        await this._redis.setex(key, TTL_SECONDS, JSON.stringify(data));
        return;
      } catch {
        // Redis error — fall through to memory
      }
    }
    this._memory.set(key, data);
  }
}

export const conversationStore = new ConversationStore();
