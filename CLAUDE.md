# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SEA-AdArena Simulator** — a browser-based e-learning tool that faithfully simulates Google Ads auction mechanics for apprentices (Auszubildende) in a risk-free sandbox. Multi-user, with an instructor (Ausbilder) role, MariaDB backend, and a Google Ads-inspired React UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MariaDB 10.6+ (InnoDB, JSON columns) |
| ORM | Sequelize 6 (MariaDB dialect) |
| Backend | Node.js 18+ + Express + TypeScript |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Charts | Recharts or Chart.js |
| Tests | Jest + Supertest (backend), Vitest (frontend) |
| Optional NLP | Spacy `de_core_news_sm` (Python) via child_process |
| Optional LLM | OpenAI / Ollama / Anthropic — configured via `.env` |

## Development Commands

```bash
# Backend (server/)
cd server
npm install
cp .env.example .env       # configure DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
npm run dev                # starts on http://localhost:3001

# Database setup
mysql -u sea_user -p sea_adarena < docs/schema.sql
npm run seed               # generates ~250 keywords + groups (idempotent — truncates first)

# Frontend (client/)
cd client
npm install
npm run dev                # starts on http://localhost:5173

# Production build
cd client && npm run build  # → dist/ served via Nginx
```

Running a single backend test (Jest):
```bash
cd server && npx jest path/to/test.spec.ts
```

Running a single frontend test (Vitest):
```bash
cd client && npx vitest run src/path/to/test.spec.tsx
```

## Architecture

### Request Flow

```
React (client/) ──REST/JSON──▶ Express (server/src/) ──Sequelize──▶ MariaDB
```

All API routes are prefixed `/api/`. JWT token is required for protected routes; the `role` claim distinguishes `admin` (instructor) from `trainee`.

### Backend Service Layer (`server/src/services/`)

The core business logic lives here — not in controllers:

- **`auction.engine.ts`** — runs 24-hour simulation in discrete steps, calculates Ad Rank and actual CPC via Google's discounting formula, deducts budget each hour, writes to `auction_results` and `hourly_stats`
- **`intent.engine.ts`** — applies intent multipliers (transactional +40 % CPC, +20 % CTR, 3.5 % CVR; informational −20 % CPC, −10 % CTR, 0.2 % CVR) to all auction calculations
- **`heuristic.engine.ts`** — handles live keyword insertion: when an unknown keyword is submitted, it calls the DataSource Manager, classifies intent, estimates search volume + CPC, and inserts into `keywords` with `intent_source = 'heuristic'`
- **`keyword-planner.ts`** — serves keyword ideas from the group hierarchy + `keyword_group_members`, including intent inheritance
- **`budget.service.ts`** — tracks per-hour cost deduction, fires `budget_exhausted` events
- **`scenario.service.ts`** — instructor-defined overrides (competitor budgets, market conditions)
- **`datasource/manager.ts`** — orchestrates the four external API calls in parallel with 2 s timeouts, falls back to local heuristic on failure

### DataSource Manager Pipeline

For unknown keywords, these run in parallel (all free, no API keys):
1. **Google Autocomplete** → related keywords → group name
2. **OpenThesaurus.de** → synonyms → intent validation
3. **Wikipedia Pageviews** → relative search volume estimate
4. *(optional)* **LLM** (OpenAI / Ollama / Anthropic) → refines group name, explains intent for the learner

If all external APIs time out, the local heuristic (signal-word matching + word-count heuristics) runs as fallback. The LLM is always optional — disabled by default unless `LLM_PROVIDER` is set in `.env`.

### Auction Math

**Ad Rank** = `max_cpc × quality_score`

**Actual CPC** = `ad_rank_of_loser / own_quality_score + €0.01`

**Quality Score** (1–10) is the average of three `below/average/above` components: expected CTR, ad relevance, landing page experience.

**Match-type impression multipliers**: Broad ×1.0, Phrase ×0.65, Exact ×0.35. Exact also gets −10 % on base CPC; Broad gets +20 %.

**Hourly traffic distribution**: 24-element array (peaks at hours 18–22), applied to `monthly_search_volume / 30.4`.

### Key Database Tables

- `keywords` — pool of all keywords (seed + heuristic-generated), with `intent_category`, `base_cpc`, `seasonality_factors` (JSON, 12 months), `intent_source`
- `campaign_keywords` — joins ad groups to keywords with `match_type` and optional `max_cpc_override`
- `keyword_groups` / `keyword_group_members` — hierarchical topic clusters (Schuhe → Sneaker → individual keywords); `relationship_type` mirrors Google Ads taxonomy
- `competitor_profiles` — three AI competitors (Der Riese, Der Discounter, Der Smarte) with `active_hours_start/end` for ad scheduling simulation
- `auction_results` — one row per keyword per hour per bidder; source of truth for the dashboard
- `simulation_log` — human-readable German-language events for the trainee (e.g., "Budget erschöpft um 15:12")

### Seed Generation (`server/seed/`)

- `ontology.ts` — declares product categories, brands, intent-suffix mappings
- `generator.ts` — Power-Law volume distribution (`Math.pow(random, 2)` log-space), intent-factor CPC, rounded to €0.05
- Uses a fixed random seed (`Math.seed = 42`) so every `npm run seed` produces identical data
- `npm run seed` is fully idempotent (TRUNCATE + re-insert)

### Frontend Structure (`client/src/`)

- `components/` — Google Ads-inspired components: `Sidebar`, `CampaignTable`, `CampaignEditor`, `KeywordEditor`, `KeywordPlanner`, `KeywordGroupTree`, `Dashboard`, `AuctionChart`, `AdminPanel`
- `services/` — REST API client (typed fetch wrappers)
- `hooks/` — shared React hooks
- `types/` — shared TypeScript interfaces mirroring backend models

### UI-Fidelity — Google Ads

**Every frontend component must match the Google Ads look and feel.** The goal is that a real Google Ads user feels immediately at home. The full spec (colors, typography, layout dimensions, component patterns, number formatting, status chips, table behavior, empty states) is in:

**`docs/google-ads-ui-spec.md`** ← normative reference, read before touching any frontend file.

Key non-negotiables:
- Colors from the `google.*` Tailwind palette (primary blue `#1a73e8`, bg `#f1f3f4`, borders `#dadce0`)
- Font: Roboto / Google Sans via Google Fonts
- All numbers formatted as `de-DE` locale (Punkt als Tausender, Komma als Dezimal, `€` nachgestellt)
- Match-type display: `[genau]` `"phrase"` `weitgehend` (bracket notation)
- Status chips with colored dots (green/gray/orange/red), togglable inline
- Table headers uppercase 12px, sortable, sticky on scroll
- Left sidebar 230px fixed, top bar 64px fixed
- Toasts bottom-left, dark background, 4 s timeout

## Environment Variables (`.env` in `server/`)

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=sea_user
DB_PASS=...
DB_NAME=sea_adarena
JWT_SECRET=...

# Optional LLM (leave empty to disable)
LLM_PROVIDER=          # openai | ollama | anthropic
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=gpt-4o-mini
LLM_MAX_TOKENS=500
```

## Domain Language

The codebase and UI are **German-first** (trainee-facing text, log messages, scenario names). Internal code (variables, comments, API field names) should be English. The primary domain is German SEA (Suchmaschinenwerbung = paid search advertising).

Roles: `admin` = Ausbilder (instructor), `trainee` = Azubi (apprentice).
