import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { Analysis, DifficultyLevel, UrgencyLevel, CompetitionLevel } from './entities/analysis.entity';
import { hashUrl } from '../../common/utils/hash.util';

export interface CreateJobDto {
  title: string;
  description: string;
  budget: number | null;
  budgetCurrency?: string;
  deadline: Date | null;
  applicantsCount: number;
  source: string;
  url: string;
  rawData?: Record<string, unknown>;
}

export interface CreateAnalysisDto {
  jobId: string;
  userId: string;
  matchScore: number;
  reason: string;
  difficulty: DifficultyLevel;
  urgency: UrgencyLevel;
  competitionLevel: CompetitionLevel;
  proposalText?: string | null;
  modelUsed?: string | null;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,

    @InjectRepository(Analysis)
    private readonly analysesRepo: Repository<Analysis>,
  ) {}

  async findById(id: string): Promise<Job | null> {
    return this.jobsRepo.findOne({ where: { id } });
  }

  async existsByUrl(url: string): Promise<boolean> {
    const count = await this.jobsRepo.count({ where: { urlHash: hashUrl(url) } });
    return count > 0;
  }

  async create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepo.create({
      ...dto,
      budgetCurrency: dto.budgetCurrency ?? 'RUB',
      urlHash: hashUrl(dto.url),
      scrapedAt: new Date(),
    });
    return this.jobsRepo.save(job);
  }

  async saveAnalysis(dto: CreateAnalysisDto): Promise<Analysis> {
    // Upsert pattern — idempotent on worker retry
    const existing = await this.analysesRepo.findOne({
      where: { jobId: dto.jobId, userId: dto.userId },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.analysesRepo.save(existing);
    }

    return this.analysesRepo.save(this.analysesRepo.create(dto));
  }

  async markSentToTelegram(analysisId: string): Promise<void> {
    await this.analysesRepo.update(analysisId, { sentToTelegram: true });
  }

  async hasBeenAnalyzed(jobId: string, userId: string): Promise<boolean> {
    const count = await this.analysesRepo.count({ where: { jobId, userId } });
    return count > 0;
  }

  /**
   * Top N job IDs that have NO analysis yet for the given user.
   * Used by backfill worker to enqueue analysis for historical jobs.
   */
  async findUnanalyzedJobIdsForUser(userId: string, limit = 50): Promise<string[]> {
    const rows = await this.jobsRepo
      .createQueryBuilder('job')
      .leftJoin(
        Analysis,
        'analysis',
        'analysis.job_id = job.id AND analysis.user_id = :userId',
        { userId },
      )
      .where('analysis.id IS NULL')
      .orderBy('job.scraped_at', 'DESC')
      .limit(limit)
      .select('job.id', 'id')
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }
}
