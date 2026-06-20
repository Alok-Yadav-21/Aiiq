# AllQ — Setup Guide

## Quick Start (5 minutes)

### 1. Start the Database

Make sure Docker Desktop is running, then:

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 2. Push the Database Schema

```bash
npx prisma db push
```

This creates all tables in PostgreSQL. Run this once.

### 3. Start the App

Terminal 1 — Next.js app:
```bash
npm run dev
```

Terminal 2 — WebSocket server:
```bash
node server/ws-server.js
```

Open http://localhost:3000

---

## Configuration

Copy `.env.example` to `.env.local` and fill in the values.

### Required for core features:
- `DATABASE_URL` — PostgreSQL connection string (works with docker-compose defaults)
- `JWT_SECRET` — Any 32+ char string

### Required for AI quiz generation:
- `OPENAI_API_KEY` — Your OpenAI API key (sk-...)
- Without this, mock questions are used automatically

### Required for payments:
- `STRIPE_SECRET_KEY` — From Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` — From Stripe webhook settings
- `STRIPE_STARTER_PRICE_ID` — Create in Stripe → Products
- `STRIPE_PRO_PRICE_ID`

---

## Architecture Overview

```
allq/
├── app/                    Next.js 15 App Router
│   ├── (auth)/            Login + Signup pages
│   ├── (dashboard)/       Protected dashboard pages
│   │   ├── dashboard/     Overview + stats
│   │   ├── subjects/      Subject marketplace + CRUD
│   │   ├── compete/       Quiz room lobby
│   │   │   └── room/[id]  Live quiz room (WebSocket)
│   │   ├── leaderboard/   Global rankings
│   │   └── settings/      Profile + subscription
│   ├── api/               REST API routes
│   │   ├── auth/          JWT auth endpoints
│   │   ├── subjects/      Subject CRUD
│   │   ├── quiz/          Quiz generation + submission
│   │   ├── rooms/         Quiz room management
│   │   ├── payments/      Stripe checkout + portal
│   │   ├── webhooks/      Stripe webhook handler
│   │   └── leaderboard/   Rankings API
│   ├── pricing/           Public pricing page
│   └── page.tsx           Landing page
├── components/
│   ├── ui/                Glass design system components
│   ├── layout/            Navbar + Sidebar
│   └── (feature)/         Feature-specific components
├── lib/
│   ├── auth.ts            JWT helpers + plan limits
│   ├── ai.ts              OpenAI quiz generation
│   ├── stripe.ts          Stripe integration
│   ├── prisma.ts          DB client
│   └── validations.ts     Zod schemas
├── hooks/
│   ├── useAuth.ts         Auth state (Zustand)
│   ├── useSocket.ts       Socket.io client hook
│   └── useToast.ts        Toast notification system
├── server/
│   └── ws-server.js       Socket.io WebSocket server (port 3001)
├── prisma/
│   └── schema.prisma      Full database schema (20+ models)
└── docker-compose.yml     Local PostgreSQL + Redis
```

---

## Feature Status

| Feature | Status |
|---------|--------|
| Email/password auth | ✅ Complete |
| JWT + refresh tokens | ✅ Complete |
| Subject marketplace | ✅ Complete |
| Material upload (text) | ✅ Complete |
| AI quiz generation | ✅ Complete (OpenAI or mock) |
| Interactive quiz session | ✅ Complete |
| Real-time quiz rooms | ✅ Complete (Socket.io) |
| Live leaderboard | ✅ Complete |
| Subscription tiers | ✅ Complete |
| Stripe payments | ✅ Complete (needs keys) |
| Dark glassmorphism UI | ✅ Complete |
| Mobile responsive | ✅ Complete |
| PDF upload | 🔧 Stub (needs AWS Textract) |
| Image OCR | 🔧 Stub (needs Tesseract) |
| OAuth (Google/GitHub) | 🔧 UI ready (needs provider setup) |

---

## Production Deployment

1. Use `docker-compose.yml` or managed PostgreSQL (Supabase, AWS RDS)
2. Deploy Next.js to Vercel or AWS ECS
3. Deploy WebSocket server to a Node.js host (Railway, Render, AWS EC2)
4. Set all env vars in production
5. Run `npx prisma migrate deploy`
6. Configure Stripe webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
