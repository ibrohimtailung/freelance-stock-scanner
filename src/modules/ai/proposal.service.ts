import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { buildProposalSystemPrompt, buildProposalUserPrompt } from './prompts/proposal.prompt';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';

const REQUIRED_ENDING = 'Готов приступить сразу после уточнения деталей';

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(private readonly aiService: AiService) {}

  async generate(job: Job, user: User): Promise<string> {
    try {
      let proposal = await this.aiService.chat(
        [
          { role: 'system', content: buildProposalSystemPrompt() },
          { role: 'user',   content: buildProposalUserPrompt(user, job) },
        ],
        { temperature: 0.7, maxTokens: 600 },
      );

      proposal = proposal.trim();

      // Guarantee the mandatory ending regardless of what the model output
      if (!proposal.endsWith(REQUIRED_ENDING)) {
        proposal = proposal.replace(/[.!\s]+$/, '') + '\n' + REQUIRED_ENDING;
      }

      return proposal;
    } catch {
      this.logger.error(`Proposal generation failed for job ${job.id} — using fallback`);
      return this.fallback(job, user);
    }
  }

  private fallback(job: Job, user: User): string {
    const skills = user.skills.slice(0, 3).join(', ');
    return (
      `Вижу задачу: ${job.title}. ` +
      `Работаю с ${skills} и реализовывал подобные проекты. ` +
      REQUIRED_ENDING
    );
  }
}
