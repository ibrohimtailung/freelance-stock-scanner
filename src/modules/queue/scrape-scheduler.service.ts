import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { QUEUE_NAMES, JOB_NAMES } from './constants/queue-names';

export interface ScrapeJobPayload {
  platforms: string[];
  triggeredAt: string;
}

export interface AnalyzeJobPayload {
  jobId: string;
  userId: string;
}

const SCRAPE_JOB_OPTIONS = {
  removeOnComplete: 50,
  removeOnFail: 20,
  attempts: 2,
  backoff: { type: 'exponential', delay: 15_000 },
};

@Injectable()
export class ScrapeSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ScrapeSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SCRAPE_JOBS)

    private readonly scrapeQueue: Queue<ScrapeJobPayload>,
  ) { }

  /** Fire immediately on startup — don't wait for the first cron tick */
  async onModuleInit(): Promise<void> {
    this.logger.log('Triggering initial scrape on startup');
    await this.enqueue();
  }

  @Cron('*/10 * * * *')
  async triggerScrape(): Promise<void> {
    await this.enqueue();
  }

  private async enqueue(): Promise<void> {
    this.logger.log('Enqueueing scrape job');
    await this.scrapeQueue.add(
      JOB_NAMES.SCRAPE,
      { platforms: ['kwork'], triggeredAt: new Date().toISOString() },
      SCRAPE_JOB_OPTIONS,
    );
  }
}
