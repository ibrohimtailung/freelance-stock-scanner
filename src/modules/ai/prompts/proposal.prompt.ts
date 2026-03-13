import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';

export function buildProposalSystemPrompt(): string {
  return `You are a professional copywriter helping a freelance developer win jobs on Kwork.
Write ONLY in Russian. Be concise, confident, and highly specific.
Avoid generic phrases or clichés. Never use "я готов помочь", "я опытный разработчик", or similar.
Focus on demonstrating understanding of THIS exact job and the candidate's relevant skills.
Output ONLY the proposal text — no labels, no quotes, no markdown, no preamble.`;
}

export function buildProposalUserPrompt(user: User, job: Job): string {
  const budgetStr = job.budget
    ? `${job.budget.toLocaleString('ru-RU')} ${job.budgetCurrency === 'RUB' ? '₽' : job.budgetCurrency}`
    : 'Не указан';

  const skillsStr = user.skills.length ? user.skills.join(', ') : 'Не указаны';
  const preferencesStr = user.jobPreferences.length ? user.jobPreferences.join(', ') : 'Не указаны';

  return `## Developer Profile
Experience: ${user.experience ?? 'Не указан'}
Skills: ${skillsStr}
Preferences: ${preferencesStr}

## Job Posting
Title: ${job.title}
Description: ${job.description}
Budget: ${budgetStr}

## Proposal Requirements
- 4–6 sentences maximum
- Language: Russian ONLY
- Tone: friendly, confident, professional
- Begin by demonstrating that you fully understand THIS specific task (do NOT start with "Здравствуйте"/"Привет")
- Mention 1–2 specific skills or experiences that match THIS job exactly
- End with THIS exact sentence, verbatim, as the final sentence:
  "Готов приступить сразу после уточнения деталей"

Write the proposal:`;
}