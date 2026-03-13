import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { buildAnalyzerSystemPrompt, buildAnalyzerUserPrompt } from './prompts/analyzer.prompt';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';
import { DifficultyLevel, UrgencyLevel, CompetitionLevel } from '../jobs/entities/analysis.entity';

export interface AnalysisResult {
  matchScore: number;
  reason: string;
  difficulty: DifficultyLevel;
  urgency: UrgencyLevel;
  competitionLevel: CompetitionLevel;
  modelUsed: string;
}

const VALID_LEVELS = ['low', 'medium', 'high'] as const;

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(private readonly aiService: AiService) {}

  async analyze(job: Job, user: User): Promise<AnalysisResult> {
    const systemPrompt = buildAnalyzerSystemPrompt();
    const userPrompt   = buildAnalyzerUserPrompt(user, job);

    let raw: string;

    try {
      raw = await this.aiService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        { temperature: 0.2, maxTokens: 500 },
      );
    } catch {
      this.logger.error(`AI analyzer failed for job ${job.id} — using fallback`);
      return this.fallback();
    }

    return this.parse(raw, job.id);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private parse(raw: string, jobId: string): AnalysisResult {
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();

      // Ba'zan model JSON oldidan/ortidan matn yuboradi yoki blokni to'liq yopmaydi.
      // Eng ehtimolli JSON bo'lagini ajratamiz: birinchi "{" dan oxirgi "}" gacha.
      const start = cleaned.indexOf('{');
      const end   = cleaned.lastIndexOf('}');

      if (start === -1 || end === -1 || end <= start) {
        throw new Error('No JSON object boundaries found in AI response');
      }

      const jsonSlice = cleaned.slice(start, end + 1);
      const parsed    = JSON.parse(jsonSlice) as Record<string, unknown>;

      return {
        matchScore:       this.clamp(Number(parsed.match_score), 0, 100),
        reason:           String(parsed.reason ?? 'No reason provided').slice(0, 500),
        difficulty:       this.validLevel(String(parsed.difficulty),        'medium') as DifficultyLevel,
        urgency:          this.validLevel(String(parsed.urgency),           'low')    as UrgencyLevel,
        competitionLevel: this.validLevel(String(parsed.competition_level), 'low')    as CompetitionLevel,
        modelUsed:        this.aiService.getModel(),
      };
    } catch (err) {
      this.logger.warn(
        `Failed to parse AI response for job ${jobId}: ${raw.slice(0, 200)}`,
        err instanceof Error ? err.stack : String(err),
      );
      return this.fallback();
    }
  }

  private validLevel(value: string, fallback: string): string {
    return (VALID_LEVELS as readonly string[]).includes(value) ? value : fallback;
  }

  private clamp(n: number, min: number, max: number): number {
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  private fallback(): AnalysisResult {
    return {
      matchScore:       0,
      reason:           'Analysis unavailable — AI service error',
      difficulty:       'medium',
      urgency:          'low',
      competitionLevel: 'low',
      modelUsed:        'fallback',
    };
  }
}
