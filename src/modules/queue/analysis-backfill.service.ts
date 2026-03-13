import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JobsService } from '../jobs/jobs.service';
import { UsersService } from '../users/users.service';
import { QUEUE_NAMES, JOB_NAMES } from './constants/queue-names';
import { AnalyzeJobPayload } from './job-processor.worker';

const BACKFILL_ANALYZE_JOB_OPTIONS = {
  removeOnComplete: 100,
  removeOnFail:     30,
  attempts:         3,
  backoff:          { type: 'exponential', delay: 5_000 },
};

@Injectable()
export class AnalysisBackfillService {
  private readonly logger = new Logger(AnalysisBackfillService.name);

  constructor(
    private readonly jobsService:  JobsService,
    private readonly usersService: UsersService,

    @InjectQueue(QUEUE_NAMES.ANALYZE_JOB)
    private readonly analyzeQueue: Queue<AnalyzeJobPayload>,
  ) {}

  /**
   * Periodically backfills analyses for jobs that are already in the DB
   * but have no Analysis row yet for a given user.
   *
   * Runs every 5 minutes and enqueues a small batch per user to avoid spikes.
   */
  @Cron('*/5 * * * *')
  async backfill(): Promise<void> {
    const users = await this.usersService.findAllActive();
    if (!users.length) return;

    this.logger.log(`Backfill: processing ${users.length} active users`);

    for (const user of users) {
      const jobIds = await this.jobsService.findUnanalyzedJobIdsForUser(user.id, 50);
      if (!jobIds.length) continue;

      this.logger.log(`Backfill: user=${user.id} jobs=${jobIds.length}`);

      await Promise.all(
        jobIds.map((jobId) =>
          this.analyzeQueue.add(
            JOB_NAMES.ANALYZE,
            { jobId, userId: user.id },
            BACKFILL_ANALYZE_JOB_OPTIONS,
          ),
        ),
      );
    }
  }
}

