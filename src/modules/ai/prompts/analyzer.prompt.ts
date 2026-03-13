import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

export function buildAnalyzerSystemPrompt(): string {
  return `You are a professional job relevance analyzer for freelance developer opportunities.
Evaluate how well a job posting matches a candidate profile.
Respond with ONLY valid JSON — no markdown, no code fences, no text outside the JSON object.
Always follow the scoring rules strictly.`;
}

export function buildAnalyzerUserPrompt(user: User, job: Job): string {
  const deadlineStr = job.deadline
    ? job.deadline.toISOString().split('T')[0]
    : 'Не указан';

  const daysUntilDeadline =
    job.deadline !== null
      ? Math.ceil((job.deadline.getTime() - Date.now()) / 86_400_000)
      : null;

  const skillsStr = user.skills.length ? user.skills.join(', ') : 'Не указаны';
  const preferencesStr = user.jobPreferences.length
    ? user.jobPreferences.join(', ')
    : 'Не указаны';

  return `## Candidate Profile
Experience: ${user.experience ?? 'Не указан'}
Skills: ${skillsStr}
Job preferences: ${preferencesStr}
Minimum budget: ${user.minBudget} RUB

## Job Posting
Title: ${job.title}
Description: ${job.description}
Budget: ${job.budget !== null ? `${job.budget} ${job.budgetCurrency}` : 'Не указан'}
Deadline: ${deadlineStr}${daysUntilDeadline !== null ? ` (${daysUntilDeadline} дней осталось)` : ''}
Applicants: ${job.applicantsCount}

## Scoring Rules
- match_score: integer 0–100 (overall fit; deduct heavily if required skills are missing)
- urgency: "high" if days ≤ 3, "medium" if ≤ 7, "low" otherwise or no deadline
- competition_level: "high" if applicants > 10, "medium" if > 5, "low" if ≤ 5
- difficulty: technical complexity based on description ("low" | "medium" | "high")
- deduct points if budget < candidate minimum

## Response (JSON only)
{
  "match_score": <integer 0-100>,
  "reason": "<1-2 concise sentences in Russian explaining fit or mismatch>",
  "difficulty": "<low|medium|high>",
  "urgency": "<low|medium|high>",
  "competition_level": "<low|medium|high>"
}`;
}