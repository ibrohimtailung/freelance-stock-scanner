import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QUEUE_NAMES } from './constants/queue-names';
import { ScrapeSchedulerService } from './scrape-scheduler.service';
import { ScrapeWorker } from './scrape.worker';
import { JobProcessorWorker } from './job-processor.worker';
import { AnalysisBackfillService } from './analysis-backfill.service';
import { ScraperModule } from '../scraper/scraper.module';
import { JobsModule } from '../jobs/jobs.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ScraperModule,
    JobsModule,
    UsersModule,
    AiModule,
    TelegramModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host:     config.getOrThrow<string>('redis.host'),
          port:     config.getOrThrow<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail:     50,
        },
      }),
    }),

    BullModule.registerQueue(
      { name: QUEUE_NAMES.SCRAPE_JOBS },
      { name: QUEUE_NAMES.ANALYZE_JOB },
    ),
  ],
  providers: [
    ScrapeSchedulerService,
    ScrapeWorker,
    JobProcessorWorker,
    AnalysisBackfillService,
  ],
  exports: [BullModule],
})
export class QueueModule {}
