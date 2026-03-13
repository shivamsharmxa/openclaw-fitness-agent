# FitCoach — AI Fitness Coach

An AI-powered personal fitness coach with a web app, Telegram bot, and GPT-4o agent.

## Project Structure

```
fitness-ai-agent/
├── backend/          Express.js REST API + OpenAI agent
├── frontend/         Next.js 14 web application
├── telegram/         Telegram bot (Telegraf.js)
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- OpenAI API key

### 1. Clone and install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Telegram bot
cd ../telegram && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, OPENAI_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET

# Frontend
cp frontend/.env.local.example frontend/.env.local

# Telegram (optional)
cp telegram/.env.example telegram/.env
```

### 3. Set up database

```bash
cd backend
npm run db:push       # Push schema to DB
npm run db:generate   # Generate Prisma client
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Telegram bot (optional)
cd telegram && npm run dev
```

### Docker (full stack)

```bash
cp .env.example .env   # Fill in values
docker-compose up --build
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Get profile |
| POST | `/api/users/me/fitness-goal` | Set fitness goal |
| POST | `/api/chat` | Chat with AI agent |
| GET | `/api/chat/history` | Conversation history |
| POST | `/api/workouts/generate` | Generate workout plan |
| GET | `/api/workouts/current` | Current plan |
| POST | `/api/workouts/logs` | Log workout |
| GET | `/api/progress` | Progress summary |
| POST | `/api/progress/metrics` | Log metric (weight etc.) |

## AI Agent Tools

| Tool | Trigger |
|------|---------|
| `workout_plan_generator` | User requests a workout plan |
| `nutrition_advisor` | Nutrition/diet questions |
| `progress_analyzer` | Progress and history queries |
| `user_profile_manager` | Read/update user stats |

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **AI**: OpenAI GPT-4o with function calling
- **Frontend**: Next.js 14, TailwindCSS, Zustand, Recharts
- **Bot**: Telegraf.js
- **Infrastructure**: Docker, Redis
