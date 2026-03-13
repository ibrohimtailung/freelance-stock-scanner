export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  },

  aiProvider: process.env.AI_PROVIDER ?? 'openrouter',

  openrouter: {
    apiKey:  process.env.OPENROUTER_API_KEY ?? '',
    model:   process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet',
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model:   process.env.OLLAMA_MODEL ?? 'llama3',
  },

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'freelancebot',
    user: process.env.DB_USER ?? 'bot',
    password: process.env.DB_PASSWORD ?? '',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  scraper: {
    intervalMinutes: parseInt(process.env.SCRAPE_INTERVAL_MINUTES ?? '2', 10),
  },

  bot: {
    minMatchScoreDefault: parseInt(process.env.MIN_MATCH_SCORE_DEFAULT ?? '60', 10),
  },
});
