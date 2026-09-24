# Foodpanda AI Search (pitch prototype)

A local demo showing how AI-powered search would improve food discovery. Today, searching
"healthy" only matches restaurants literally named "healthy". This app understands requests like:

- "chicken and lettuce sandwich around 300 calories"
- "air fried fries"
- "dinner for 4 people under Rs. 4,000"
- "high protein under Rs. 1,000, no beef"

It reads the menus of restaurants in the selected Lahore area and returns the best matching
dishes, or complete meal combos for groups, each with a short reason based on real menu facts.

> All restaurant data is mock data from `data/foodpanda-ai-seed-data.json`.
> Not affiliated with or endorsed by Foodpanda.

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 + shadcn/ui · MongoDB + Mongoose ·
Zod · Google Gemini (default; Groq and Anthropic supported) · Vitest.

## Setup

You need **Node.js 20+** (tested on 24), **MongoDB** and a **free Gemini API key**.

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB locally (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community     # stop: brew services stop mongodb-community
```

### 3. Get a free Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/) and sign in.
2. Click **Get API key** → **Create API key**, then copy it.

Optional backup provider: a free [Groq](https://console.groq.com/keys) key (set
`LLM_PROVIDER=groq` to use it).

### 4. Configure environment

```bash
cp .env.example .env.local
```

Then set at least:

```bash
MONGODB_URI=mongodb://localhost:27017/foodpanda_ai
GEMINI_API_KEY=your-key-here
```

| Variable                                                | Required                | Notes                                                         |
| ------------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| `MONGODB_URI`                                           | yes                     | Local or Atlas connection string, including the database name |
| `LLM_PROVIDER`                                          | no                      | `gemini` (default), `groq` or `anthropic`                     |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `ANTHROPIC_API_KEY` | for the chosen provider | Only the selected provider's key is required                  |
| `LLM_MODEL`                                             | no                      | Ranks results. Gemini default: `gemini-3.5-flash-lite`        |
| `LLM_FAST_MODEL`                                        | no                      | Parses queries. Gemini default: `gemini-3.5-flash-lite`       |
| `LLM_BACKUP_MODEL`                                      | no                      | One retry on 429/503. Gemini default: `gemini-3.1-flash-lite` |

Small, fast models are the default: they are accurate enough for these tasks, answer in 1–3 s,
and go easy on free-tier quotas. Each Gemini model has its own quota, so the backup model keeps
search working if the main one is rate-limited.

### 5. Load the data

```bash
npm run seed
```

Idempotent: safe to run again. It validates the JSON (including every cross-reference), upserts
6 areas, 30 restaurants, 391 menu items and 60 deals, and removes anything no longer in the file.

### 6. Run

```bash
npm run dev          # http://localhost:3000
```

## Demo script

1. Open `http://localhost:3000/?area=gulberg`.
2. Turn on **Compare with today's search**.
3. Click **Dinner for 4 under Rs. 4,000**. "Today's search" finds nothing; AI search returns three
   costed meals from three restaurants, each within budget, using deals with real savings.
4. Click **Air-fried fries** and **Chicken lettuce sandwich ~300 cal** to show precision.
5. For Q&A, type "3000 PKR for 6 people, burgers and chips": the AI explains honestly that it
   can't be done and quotes the cheapest real option.

Tips for a live pitch: run each demo query once beforehand. Results are cached in memory for an
hour, so on stage they return instantly and don't use API quota. Keep the laptop awake and on power.

## How it works

1. **Understand**: the LLM converts the query into structured constraints (Zod-validated, one retry
   with the validation error). Code then maps synonyms (chips → fries) and applies the "healthy" rule.
2. **Filter**: code narrows available items from open restaurants in the area. Price caps,
   exclusions, avoided cooking methods and dietary tags are never relaxed; calories, then cooking
   method, then dish type are relaxed step by step if fewer than 10 candidates remain (max 60).
3. **Rank / plan**:
   - Single dish: the LLM ranks the candidates (IDs only) and returns the top 8 with reasons.
   - Groups/budgets: a bounded beam search in code builds single-restaurant combos that fit the
     budget (including delivery fee), cover every required category and give each person a main;
     it scores them by value, deal savings, variety and rating, and the LLM picks the best 3.
4. **Explain**: every result gets a short reason citing real facts.

### Guardrails

- IDs the LLM returns are checked against the candidate list; unknown ones are dropped.
- Prices, totals, savings and per-person costs are always computed in code.
- A reason quoting a number that isn't in the data is replaced by a factual, code-written reason.
- On LLM timeout (10 s), rate limit or error, search falls back to keyword results with a notice.
- At most 2 LLM calls per search (plus a single retry only when a call fails).
- `/api/search` is rate-limited to 20 requests/min per IP; responses are cached for 1 hour.
- Every search is logged to the `searchlogs` collection (query, area, constraints, result IDs,
  mode, provider, latency, fallback).

## API

| Endpoint                      | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| `GET /api/areas`              | All areas                                                             |
| `GET /api/restaurants/[slug]` | Restaurant with full menu and deals                                   |
| `POST /api/search`            | Body `{ query, areaSlug, mode: "ai" \| "keyword" }` → items or combos |

## Scripts

| Script                        | What it does                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `npm run dev`                 | Start the dev server                                         |
| `npm run seed`                | Load/refresh the mock data into MongoDB                      |
| `npm run build` / `npm start` | Production build / serve                                     |
| `npm run lint`                | ESLint (Next + TypeScript rules, `no-explicit-any` as error) |
| `npm run typecheck`           | `tsc --noEmit` (strict mode)                                 |
| `npm run format`              | Prettier (with Tailwind class sorting)                       |
| `npm test`                    | Vitest unit tests (no database or API key needed)            |

> Don't run `npm run build` while `npm run dev` is running: both write to `.next` and the dev
> server will break. Stop the dev server first.

## Project structure

```
data/                      Seed JSON
scripts/seed.ts            Idempotent seed loader
src/app/                   Pages (/, /about, /restaurant/[slug]) and API routes
src/components/search/     Search box, chips, area selector, compare toggle, "Understood as" chips
src/components/results/    Item and combo cards, compare view, skeletons, empty/fallback states
src/components/restaurant/ Restaurant page pieces
src/lib/ai/                Provider wrapper (Gemini, Groq, Anthropic), prompts, Zod schemas
src/lib/search/            Pipeline: parse, normalize, retrieve, rank, combos, keyword, orchestrator
src/lib/db/                Mongoose connection and models
tests/                     Unit tests
```

## Troubleshooting

- **"AI unavailable, showing keyword results"**: the free-tier quota was hit or Google is busy.
  Wait a minute, or set `LLM_PROVIDER=groq` with a Groq key.
- **Page loads but shows no restaurants**: MongoDB isn't running or wasn't seeded. Run
  `brew services start mongodb-community` and `npm run seed`.
- **Dev server errors after a build**: stop it, delete `.next`, and run `npm run dev` again.
