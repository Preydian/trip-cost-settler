# Trip Cost Settler

A web app for splitting group trip expenses. Paste informal messages about who paid for what, and AI extracts the expenses, calculates who owes whom, and tracks payments until everyone is settled.

## Features

- **AI Expense Extraction** — Paste group chat messages and Google Gemini parses out payers, amounts, descriptions, and splits automatically
- **Review & Edit** — Correct AI extractions, adjust splits, add or remove expenses before settling
- **Settlement Calculation** — Greedy algorithm minimizes the number of payments needed to square up
- **Payment Tracking** — Mark payments as confirmed, see progress at a glance
- **Late Expenses** — Add expenses after settling (bulk via AI or single manual entry) with automatic recalculation
- **Shareable Trips** — Share a read-only link with trip participants
- **Dashboard** — Overview of all your trips with status, stats, and quick actions
- **Auth** — Email-based authentication via Supabase; trips are tied to your account

## Tech Stack

- **Next.js 16** (App Router, Server Actions, React 19)
- **Supabase** (PostgreSQL, Auth, RLS)
- **Google Gemini** (AI expense extraction)
- **Tailwind CSS 4** + **shadcn/ui**
- **TypeScript**, **Zod**, **React Hook Form**

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://ai.google.dev)

### Setup

```bash
git clone <repo-url>
cd trip-cost-settler
npm install
```

Copy the example env file and fill in your keys:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### Database

Run `supabase/schema.sql` in your Supabase SQL Editor to create the tables and RLS policies. Then apply any migrations in order:

1. `supabase/migration-add-user-id.sql`
2. `supabase/migration-fix-rls-authenticated.sql`

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Paste** — Create a trip and paste your group expense messages
2. **Review** — The AI extracts expenses; review, edit, or add more
3. **Settle** — See the balance summary and optimized payment plan
4. **Track** — Confirm payments as they happen; add late expenses anytime with automatic recalculation

## Project Structure

```
app/                    Next.js routes and API
  trip/[id]/            Trip detail page
  api/extract-expenses/ Gemini extraction endpoint
actions/                Server actions (trips, expenses, settlements, auth)
components/             React components
  ui/                   shadcn/ui primitives
lib/                    Utilities, types, Supabase clients, AI extraction
supabase/               Schema and migrations
```

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start dev server         |
| `npm run build` | Production build         |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
