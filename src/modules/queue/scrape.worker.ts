import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job as BullJob, Queue } from 'bull';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ScraperService } from '../scraper/scraper.service';
import { JobsService } from '../jobs/jobs.service';
import { UsersService } from '../users/users.service';
import { hashUrl } from '../../common/utils/hash.util';
import { QUEUE_NAMES, JOB_NAMES } from './constants/queue-names';
import { ScrapeJobPayload } from './scrape-scheduler.service';
import { AnalyzeJobPayload } from './job-processor.worker';

const REDIS_SEEN_KEY = 'seen:jobs';
const REDIS_SEEN_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

const ANALYZE_JOB_OPTIONS = {
  removeOnComplete: 100,
  removeOnFail: 30,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
};

@Processor(QUEUE_NAMES.SCRAPE_JOBS)
export class ScrapeWorker {
  private readonly logger = new Logger(ScrapeWorker.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly jobsService: JobsService,
    private readonly usersService: UsersService,

    @InjectRedis()
    private readonly redis: Redis,

    @InjectQueue(QUEUE_NAMES.ANALYZE_JOB)
    private readonly analyzeQueue: Queue<AnalyzeJobPayload>,
  ) { }

  @Process(JOB_NAMES.SCRAPE)
  async handle(bullJob: BullJob<ScrapeJobPayload>): Promise<void> {
    const { triggeredAt } = bullJob.data;
    this.logger.log(`Scrape worker started (triggered: ${triggeredAt})`);

    const scrapedJobs = await this.scraperService.scrapeAll();
    this.logger.log(`Total scraped: ${scrapedJobs.length}`);

    let newJobs = 0;
    let dupes = 0;

    for (const scraped of scrapedJobs) {
      const urlHash = hashUrl(scraped.url);

      // ── 1. Redis dedup (O(1), avoids DB roundtrip) ──────────────────────
      const added = await this.redis.sadd(REDIS_SEEN_KEY, urlHash);
      await this.redis.expire(REDIS_SEEN_KEY, REDIS_SEEN_TTL_SEC);

      if (!added) { dupes++; continue; }


      // ── 2. Persist to DB ─────────────────────────────────────────────────
      let savedJob;
      try {
        savedJob = await this.jobsService.create({
          title: scraped.title,
          description: scraped.description,
          budget: scraped.budget,
          budgetCurrency: scraped.budgetCurrency,
          deadline: scraped.deadline,
          applicantsCount: scraped.applicantsCount,
          source: scraped.source,
          url: scraped.url,
          rawData: scraped.rawData,
        });
        newJobs++;
      } catch {
        // Unique constraint hit — another worker saved it first (race condition)
        dupes++;
        continue;
      }

      // ── 3. Enqueue analysis for every active user ─────────────────────────
      const users = await this.usersService.findAllActive();

      await Promise.all(
        users.map((user) =>
          this.analyzeQueue.add(
            JOB_NAMES.ANALYZE,
            { jobId: savedJob.id, userId: user.id },
            ANALYZE_JOB_OPTIONS,
          ),
        ),
      );
    }

    this.logger.log(`Scrape complete — new: ${newJobs}, dupes: ${dupes}`);
  }
}
