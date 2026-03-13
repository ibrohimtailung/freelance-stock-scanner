import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  TELEGRAM_BOT_TOKEN: Joi.string().required(),

  AI_PROVIDER: Joi.string()
    .valid('openrouter', 'ollama')
    .default('openrouter'),

  OPENROUTER_API_KEY: Joi.string().optional().allow(''),
  OPENROUTER_MODEL: Joi.string().default('anthropic/claude-3.5-sonnet'),
  OPENROUTER_BASE_URL: Joi.string().default('https://openrouter.ai/api/v1'),

  OLLAMA_BASE_URL: Joi.string().default('http://localhost:11434'),
  OLLAMA_MODEL: Joi.string().default('llama3'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  SCRAPE_INTERVAL_MINUTES: Joi.number().default(2),
  MIN_MATCH_SCORE_DEFAULT: Joi.number().default(60),
});
