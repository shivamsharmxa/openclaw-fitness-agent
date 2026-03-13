/**
 * FitnessCoachAgent
 *
 * Powered by the Vercel AI SDK with Groq as the inference provider.
 * Architecture:
 *   - generateText / streamText  →  agent orchestration + tool selection
 *   - @ai-sdk/groq               →  LLM inference
 *   - 4 registered tools         →  workout, nutrition, progress, profile
 *   - maxSteps: 3                →  multi-step reasoning loop (no manual while-loop)
 *   - Redis (with in-memory fallback) → conversation context store
 */

import { generateText, streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { buildSystemPrompt } from './prompts/systemPrompt.js';
import { workoutPlanTool } from './tools/workoutPlanTool.js';
import { nutritionAdvisorTool } from './tools/nutritionTool.js';
import { progressAnalyzerTool } from './tools/progressTool.js';
import { userProfileTool } from './tools/userProfileTool.js';
import { prisma } from '../prisma/client.js';
import { conversationStore } from './conversationStore.js';

// ── Groq provider ─────────────────────────────────────────────────────────────
const groq = createGroq({ apiKey: env.GROQ_API_KEY });

// ── Tool factory — binds verified userId via closure ──────────────────────────
// The model may hallucinate or misread the userId from the system prompt.
// We override params.userId with the server-verified userId from the JWT session.
function createBoundTools(userId) {
  const bind = (t) => ({
    ...t,
    execute: (params, opts) => t.execute({ ...params, userId }, opts),
  });
  return {
    workout_plan_generator: bind(workoutPlanTool),
    nutrition_advisor:      bind(nutritionAdvisorTool),
    progress_analyzer:      bind(progressAnalyzerTool),
    user_profile_manager:   bind(userProfileTool),
  };
}


// ── Token budget guard (≈4 chars/token) ──────────────────────────────────────
const MAX_CONTEXT_TOKENS = 6000;

function trimToTokenBudget(history) {
  let count = 0;
  const kept = [];
  for (let i = history.length - 1; i >= 0; i--) {
    count += Math.ceil((history[i].content?.length ?? 0) / 4);
    if (count > MAX_CONTEXT_TOKENS) break;
    kept.unshift(history[i]);
  }
  return kept;
}

// Strip any <think>...</think> blocks that leak through despite budget_tokens: 0
function stripThinkBlocks(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function runFitnessAgent({ userId, message, channel = 'web' }) {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    include: { fitnessGoal: true },
  });

  const systemPrompt = buildSystemPrompt(userProfile);
  const history = await conversationStore.get(userId);
  history.push({ role: 'user', content: message });

  const trimmedHistory = trimToTokenBudget(history);

  logger.debug('FitnessCoachAgent invoked', { userId, channel, historyLength: trimmedHistory.length });

  return runFitnessAgent_generate({ userId, message, systemPrompt, trimmedHistory, history, channel });
}

// ── Non-streaming ─────────────────────────────────────────────────────────────
async function runFitnessAgent_generate({ userId, message, systemPrompt, trimmedHistory, history, channel }) {
  const toolsUsedInRun = [];

  const result = await generateText({
    model: groq(env.AI_MODEL),
    system: systemPrompt,
    messages: trimmedHistory,
    tools: createBoundTools(userId),
    maxSteps: 3,
    temperature: 0.7,
    maxTokens: env.AI_MAX_TOKENS,

    onStepFinish({ toolCalls }) {
      toolCalls?.forEach(tc => toolsUsedInRun.push(tc.toolName));
    },
  });

  const responseText = stripThinkBlocks(result.text);

  history.push({ role: 'assistant', content: responseText });
  await conversationStore.set(userId, history);

  prisma.conversationLog.create({
    data: { userId, userMessage: message, agentResponse: responseText, toolsUsed: toolsUsedInRun, channel, tokensUsed: result.usage?.totalTokens ?? null },
  }).catch(err => logger.error('Failed to log conversation', { error: err.message }));

  return { content: responseText, toolsUsed: toolsUsedInRun, tokensUsed: result.usage?.totalTokens };
}

// ── True streaming ────────────────────────────────────────────────────────────
export async function* streamFitnessAgent({ userId, message, channel = 'web' }) {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    include: { fitnessGoal: true },
  });

  const systemPrompt = buildSystemPrompt(userProfile);
  const history = await conversationStore.get(userId);
  history.push({ role: 'user', content: message });
  const trimmedHistory = trimToTokenBudget(history);

  logger.debug('FitnessCoachAgent streaming', { userId, channel, historyLength: trimmedHistory.length });

  const toolsUsedInRun = [];
  let fullText = '';

  const result = streamText({
    model: groq(env.AI_MODEL),
    system: systemPrompt,
    messages: trimmedHistory,
    tools: createBoundTools(userId),
    maxSteps: 3,
    temperature: 0.7,
    maxTokens: env.AI_MAX_TOKENS,

    onStepFinish({ toolCalls }) {
      toolCalls?.forEach(tc => toolsUsedInRun.push(tc.toolName));
    },
  });

  for await (const chunk of result.textStream) {
    fullText += chunk;
    yield chunk;
  }

  // Fire-and-forget persistence — must NOT await here.
  // Awaiting after the last yield blocks the caller's for-await loop,
  // preventing chatController from writing [DONE] and ending the response.
  Promise.resolve().then(async () => {
    const cleanText = stripThinkBlocks(fullText);
    history.push({ role: 'assistant', content: cleanText });
    await conversationStore.set(userId, history);
    const usage = (await result.usage)?.totalTokens;
    prisma.conversationLog.create({
      data: { userId, userMessage: message, agentResponse: cleanText, toolsUsed: toolsUsedInRun, channel, tokensUsed: usage ?? null },
    }).catch(err => logger.error('Failed to log conversation', { error: err.message }));
  }).catch(err => logger.error('Post-stream persistence failed', { error: err.message }));
}

export async function clearConversation(userId) {
  await conversationStore.delete(userId);
  logger.debug('Conversation cleared', { userId });
}
