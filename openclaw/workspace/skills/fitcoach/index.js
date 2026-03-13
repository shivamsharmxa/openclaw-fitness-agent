/**
 * fitcoach OpenClaw skill
 *
 * Bridges the OpenClaw Telegram gateway to the FitCoach Express backend.
 * The backend runs the full Vercel AI SDK agent (Groq + tools) — this skill
 * is purely an HTTP relay so OpenClaw stays as a thin channel layer.
 *
 * Environment variables (set in ~/.openclaw/.env or your shell):
 *   FITCOACH_API_URL      — backend base URL, default http://localhost:4000
 *   FITCOACH_INTERNAL_KEY — value of INTERNAL_API_KEY in backend/.env
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.FITCOACH_API_URL ?? 'http://localhost:4000',
  timeout: 60_000, // agent may take time on first tool call
  headers: {
    'Content-Type': 'application/json',
    'x-internal-key': process.env.FITCOACH_INTERNAL_KEY ?? '',
  },
});

function notLinkedReply(telegramId) {
  return (
    `👋 Welcome to FitCoach!\n\n` +
    `Your Telegram ID is: \`${telegramId}\`\n\n` +
    `To get started:\n` +
    `1. Register at the FitCoach web app\n` +
    `2. Complete your fitness profile\n` +
    `3. Go to Settings → Telegram Integration\n` +
    `4. Paste your Telegram ID (above) and click Link\n` +
    `5. Come back and message me — I'll be ready!\n\n` +
    `Once linked, I can give you personalised workout plans, nutrition advice, and track your progress. 💪`
  );
}

/**
 * resolve_and_chat
 *
 * Resolves the Telegram user → app userId, then proxies their message through
 * the FitCoach agent. Returns the agent's reply ready to send on Telegram.
 *
 * @param {object} params
 * @param {string} params.telegramId  — Telegram numeric user ID (as string)
 * @param {string} params.message     — user's message text
 * @returns {{ reply: string, linked: boolean }}
 */
export async function resolve_and_chat({ telegramId, message }) {
  // 1 — resolve Telegram ID → app user
  let userId;
  try {
    const { data } = await api.get(`/api/telegram/user/${telegramId}`);
    userId = data.user?.id;
  } catch (err) {
    if (err.response?.status === 404) {
      return { reply: notLinkedReply(telegramId), linked: false };
    }
    throw new Error(`User lookup failed: ${err.message}`);
  }

  if (!userId) {
    return { reply: notLinkedReply(telegramId), linked: false };
  }

  // 2 — call the FitCoach agent (full Vercel AI SDK reasoning loop)
  const { data } = await api.post('/api/telegram/chat', { userId, message });

  return {
    reply: data.reply ?? "I couldn't generate a response. Please try again.",
    linked: true,
  };
}
