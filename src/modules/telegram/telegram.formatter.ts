import { Job } from '../jobs/entities/job.entity';
import { Analysis } from '../jobs/entities/analysis.entity';
import { User } from '../users/entities/user.entity';

// ─── Emoji helpers ────────────────────────────────────────────────────────────

function scoreEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  return '🔴';
}

function urgencyEmoji(u: string): string {
  return { high: '🔥', medium: '⏳', low: '📅' }[u] ?? '📅';
}

function competitionEmoji(c: string): string {
  return { high: '👥👥👥', medium: '👥👥', low: '👥' }[c] ?? '👥';
}

function difficultyEmoji(d: string): string {
  return { high: '🔴', medium: '🟡', low: '🟢' }[d] ?? '🟡';
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDeadline(deadline: Date | null): string {
  if (!deadline) return 'Не указан';

  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return 'Истёк';
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  if (days <= 7)  return `${days} дн.`;
  return deadline.toLocaleDateString('ru-RU');
}

function formatBudget(budget: number | null, currency: string): string {
  if (budget === null) return 'Не указан';
  const symbol = currency === 'RUB' ? '₽' : currency;
  return `${budget.toLocaleString('ru-RU')} ${symbol}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Formats a complete job notification for Telegram (MarkdownV2).
 */
export function formatJobMessage(
  job: Job,
  analysis: Analysis,
  proposal: string,
): string {
  return [
    // Title
    `💼 *${esc(job.title)}*`,
    ``,
    // Description (shortened if very long)
    `📄 ${esc(job.description.length > 500 ? job.description.slice(0, 500) + '…' : job.description)}`,
    ``,
    // Budget / deadline / applicants
    `💰 Бюджет: *${esc(formatBudget(job.budget, job.budgetCurrency))}*`,
    `${urgencyEmoji(analysis.urgency)} Дедлайн: ${esc(formatDeadline(job.deadline))}`,
    `${competitionEmoji(analysis.competitionLevel)} Откликов: *${job.applicantsCount}*`,
    ``,
    // Match score + AI comment
    `${scoreEmoji(analysis.matchScore)} Совпадение: *${analysis.matchScore}/100*`,
    `🧠 Комментарий ИИ: ${esc(analysis.reason)}`,
    ``,
    // Suggested reply
    // Parentheses must be escaped for Telegram MarkdownV2
    `📝 *Отклик \\(черновик\\):*`,
    `_${esc(proposal)}_`,
  ].join('\n');
}

export function formatWelcomeMessage(firstName: string | null): string {
  const name = firstName ? `, ${esc(firstName)}` : '';
  return [
    `👋 *Привет${name}\\!*`,
    ``,
    `Я помогу найти подходящие фриланс\\-заказы на Kwork и сразу подготовлю отклик\\.`,
    ``,
    `Давай настроим профиль — займёт меньше минуты\\.`,
  ].join('\n');
}

export function formatProfileSummary(user: User): string {
  return [
    `✅ *Профиль сохранён\\!*`,
    ``,
    `👨‍💻 Опыт: ${esc(user.experience ?? 'Не указан')}`,
    `🛠 Навыки: ${esc(user.skills.join(', ') || 'Не указаны')}`,
    `🎯 Предпочтения: ${esc(user.jobPreferences.join(', ') || 'Не указаны')}`,
    `💰 Мин\\. бюджет: ${esc(formatBudget(user.minBudget, 'RUB'))}`,
    ``,
    `Бот запущен и пришлёт первые результаты в ближайшие минуты\\.`,
  ].join('\n');
}

/**
 * Escape all MarkdownV2 reserved characters.
 */
export function esc(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
