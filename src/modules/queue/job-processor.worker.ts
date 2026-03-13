import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { JobsService } from '../jobs/jobs.service';
import { UsersService } from '../users/users.service';
import { AnalyzerService } from '../ai/analyzer.service';
import { ProposalService } from '../ai/proposal.service';
import { TelegramService } from '../telegram/telegram.service';
import { QUEUE_NAMES, JOB_NAMES } from './constants/queue-names';

export interface AnalyzeJobPayload {
  jobId: string;
  userId: string;
}

@Processor(QUEUE_NAMES.ANALYZE_JOB)
export class JobProcessorWorker {
  private readonly logger = new Logger(JobProcessorWorker.name);

  constructor(
    private readonly jobsService:     JobsService,
    private readonly usersService:    UsersService,
    private readonly analyzerService: AnalyzerService,
    private readonly proposalService: ProposalService,
    private readonly telegramService: TelegramService,
  ) {}

  @Process(JOB_NAMES.ANALYZE)
  async handle(bullJob: BullJob<AnalyzeJobPayload>): Promise<void> {
    const { jobId, userId } = bullJob.data;
    this.logger.log(`Analyzing job=${jobId} for user=${userId}`);

    // ── Idempotency guard (safe to retry) ─────────────────────────────────
    if (await this.jobsService.hasBeenAnalyzed(jobId, userId)) {
      this.logger.debug(`Already analyzed job=${jobId} user=${userId} — skip`);
      return;
    }

    // ── Load data ──────────────────────────────────────────────────────────
    const [job, user] = await Promise.all([
      this.jobsService.findById(jobId),
      this.usersService.findById(userId),
    ]);

    if (!job)  { this.logger.warn(`Job not found: ${jobId}`);  return; }
    if (!user) { this.logger.warn(`User not found: ${userId}`); return; }

    // ── Step 1: AI relevance analysis ─────────────────────────────────────
    const analysis = await this.analyzerService.analyze(job, user);

    this.logger.log(
      `Score=${analysis.matchScore} urgency=${analysis.urgency} ` +
      `competition=${analysis.competitionLevel} job=${jobId}`,
    );

    // ── Step 2: Generate proposal (only if relevant enough) ───────────────
    let proposalText: string | null = null;
    // For testing, always generate a proposal regardless of matchScore
    if (true) {
      proposalText = await this.proposalService.generate(job, user);
    }

    // ── Step 3: Persist analysis ──────────────────────────────────────────
    const saved = await this.jobsService.saveAnalysis({
      jobId,
      userId,
      matchScore:       analysis.matchScore,
      reason:           analysis.reason,
      difficulty:       analysis.difficulty,
      urgency:          analysis.urgency,
      competitionLevel: analysis.competitionLevel,
      proposalText,
      modelUsed:        analysis.modelUsed,
    });

    // ── Step 4: Send Telegram notification ────────────────────────────────
    // For testing, always send to Telegram when proposal exists
    if (proposalText) {
      try {
        await this.telegramService.sendJobNotification(user, job, saved, proposalText);
        await this.jobsService.markSentToTelegram(saved.id);
      } catch (err) {
        // Notification failures are non-fatal; BullMQ will NOT retry for this
        this.logger.error(`Telegram notification failed job=${jobId}`, (err as Error).message);
      }
    }
  }
}
