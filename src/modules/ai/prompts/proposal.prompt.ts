import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

export function buildProposalSystemPrompt(): string {
  return `You are a professional copywriter helping a freelance developer win jobs on Kwork.
Write ONLY in Russian. Be concise, confident, and professional.
Avoid generic phrases. Do NOT use "я готов помочь", "я опытный разработчик", or similar clichés.
Output ONLY the proposal text — no labels, no quotes, no markdown, no preamble.`;
}

export function buildProposalUserPrompt(user: User, job: Job): string {
  const budgetStr = job.budget
    ? `${job.budget.toLocaleString('ru-RU')} ${job.budgetCurrency === 'RUB' ? '₽' : job.budgetCurrency}`
    : 'Не указан';

  return `## Developer Profile
Experience: ${user.experience ?? 'Not specified'}
Skills: ${user.skills.join(', ')}
Preferences: ${user.jobPreferences.join(', ')}

## Job Posting
Title: ${job.title}
Description: ${job.description}
Budget: ${budgetStr}

## Proposal Requirements
- 4–6 sentences maximum
- Language: Russian ONLY
- Tone: friendly, confident, professional
- Begin by showing you understand the specific task (NOT with "Здравствуйте"/"Привет")
- Mention 1–2 specific skills or experiences relevant to THIS exact job
- End with EXACTLY this sentence, verbatim, as the final sentence:
  "Готов приступить сразу после уточнения деталей"

Write the proposal:`;
}
