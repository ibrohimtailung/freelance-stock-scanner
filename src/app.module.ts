import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { AiModule } from './modules/ai/ai.module';
import { QueueModule } from './modules/queue/queue.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [
    // ── Global config ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal:         true,
      load:             [configuration],
      validationSchema,
      envFilePath:      '.env',
    }),

    // ── Redis (shared ioredis instance for deduplication) ─────────────────
    RedisModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        options: {
          host:     config.getOrThrow<string>('redis.host'),
          port:     config.getOrThrow<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),

    // ── Persistence ────────────────────────────────────────────────────────
    DatabaseModule,

    // ── Domain modules ─────────────────────────────────────────────────────
    UsersModule,
    JobsModule,
    ScraperModule,
    AiModule,

    // ── Infrastructure ─────────────────────────────────────────────────────
    QueueModule,     // BullMQ workers + cron scheduler
    TelegramModule,  // Telegraf bot + onboarding wizard
  ],
})
export class AppModule {}
