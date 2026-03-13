---
name: fitcoach
description: "FitCoach fitness AI relay. Use for every user message about fitness, workouts, nutrition, progress tracking, or health questions. Resolves the Telegram user to their FitCoach account, then sends the message through the full AI fitness agent. Call this for all fitness-related messages — do not answer from general knowledge."
metadata: { "openclaw": { "emoji": "🏋️" } }
---

# FitCoach Skill

Routes Telegram messages to the FitCoach backend AI agent and returns its response.

## resolve_and_chat

Resolves a Telegram user to their FitCoach account, then sends their message
to the fitness AI agent and returns the agent's reply.

Parameters:
- `telegramId` (string, required) — the sender's Telegram numeric user ID
- `message` (string, required) — the user's exact message text

Returns:
- `reply` (string) — the agent's response to show the user
- `linked` (boolean) — false if the account is not linked yet

## When to Use

Call `resolve_and_chat` for every message the user sends about:
- Workout plans, exercises, training schedules
- Nutrition, calories, macros, meal plans
- Progress tracking, weight, metrics
- General fitness and health questions
- Any follow-up in an ongoing fitness conversation

## When NOT to Use

Only skip this skill for:
- System errors (the skill itself threw an exception)
