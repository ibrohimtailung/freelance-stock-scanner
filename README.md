# FreelanceBot — Freelance Job Scanner

Automated NestJS bot that scrapes Kwork every 2 minutes, scores jobs via OpenRouter AI, generates Russian proposals, and delivers matches to Telegram.

## Architecture

```
Cron (2 min)
  → BullMQ scrape-jobs queue
    → ScrapeWorker (Playwright)
      → Redis dedup (O(1))
        → PostgreSQL jobs table
          → BullMQ analyze-job queue (per user)
            → JobProcessorWorker
              → OpenRouter AI → match_score
              → OpenRouter AI → Russian proposal
                → Telegram notification
```

## Quick Start

### 1. Clone & configure

```bash
cp .env.example .env
# Fill in all values in .env
```

### 2. Run with Docker Compose

```bash
cd docker
docker compose up --build
```

### 3. Run locally (development)

```bash
# Start PostgreSQL and Redis
docker compose -f docker/docker-compose.yml up postgres redis -d

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start in dev mode (auto-restart on changes)
npm run start:dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather |
| `OPENROUTER_API_KEY` | ✅ | From openrouter.ai/keys |
| `OPENROUTER_MODEL` | — | Default: `anthropic/claude-3.5-sonnet` |
| `DB_HOST` | ✅ | PostgreSQL host |
| `DB_NAME` | ✅ | Database name |
| `DB_USER` | ✅ | Database user |
| `DB_PASSWORD` | ✅ | Database password |
| `REDIS_HOST` | ✅ | Redis host |
| `MIN_MATCH_SCORE_DEFAULT` | — | Default: `60` (0–100) |
| `SCRAPE_INTERVAL_MINUTES` | — | Default: `2` |

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Launch bot + onboarding wizard |
| `/profile` | View current profile |
| `/setup` | Re-run onboarding |
| `/pause` | Pause notifications |
| `/resume` | Resume notifications |
| `/help` | Show all commands |

## Adding a New Platform

1. Create `src/modules/scraper/platforms/upwork.scraper.ts` implementing `IPlatformScraper`
2. Add it to `ScraperModule` providers
3. Inject + register in `ScraperService.onModuleInit()`

That's it — no other files need to change.

## Database Migrations (Production)

```bash
# Generate migration after entity changes
npm run migration:generate -- src/database/migrations/002_name

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```
