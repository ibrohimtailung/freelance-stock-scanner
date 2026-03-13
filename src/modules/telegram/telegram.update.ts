import { Update, Start, Command, Ctx } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { UsersService } from '../users/users.service';
import { ONBOARDING_SCENE } from './scenes/onboarding.scene';
import { esc } from './telegram.formatter';

type SceneCtx = Scenes.SceneContext;

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(private readonly usersService: UsersService) {}

  // ── /start ────────────────────────────────────────────────────────────────

  @Start()
  async onStart(@Ctx() ctx: SceneCtx): Promise<void> {
    const from = ctx.from;
    if (!from) return;

    const user = await this.usersService.findByTelegramId(from.id);

    if (user?.isOnboarded) {
      await ctx.reply(
        `👋 С возвращением, *${esc(from.first_name ?? 'друг')}*\\!\n\n` +
        `Бот активен и мониторит заказы\\.  \n` +
        `Используй /profile для просмотра настроек или /setup для их изменения\\.`,
        { parse_mode: 'MarkdownV2' },
      );
    } else {
      await ctx.scene.enter(ONBOARDING_SCENE);
    }
  }

  // ── /setup — re-run onboarding ────────────────────────────────────────────

  @Command('setup')
  async onSetup(@Ctx() ctx: SceneCtx): Promise<void> {
    await ctx.scene.enter(ONBOARDING_SCENE);
  }

  // ── /profile ──────────────────────────────────────────────────────────────

  @Command('profile')
  async onProfile(@Ctx() ctx: SceneCtx): Promise<void> {
    const from = ctx.from;
    if (!from) return;

    const user = await this.usersService.findByTelegramId(from.id);

    if (!user?.isOnboarded) {
      await ctx.reply('❌ Профиль не найден\\. Запусти /start\\.', { parse_mode: 'MarkdownV2' });
      return;
    }

    const active = user.isActive ? '✅ Включены' : '❌ Выключены';

    await ctx.reply(
      [
        `👤 *Твой профиль*`,
        ``,
        `👨‍💻 Опыт: ${esc(user.experience ?? 'Не указан')}`,
        `🛠 Навыки: ${esc(user.skills.join(', ') || '—')}`,
        `🎯 Предпочтения: ${esc(user.jobPreferences.join(', ') || '—')}`,
        `💰 Мин\\. бюджет: ${esc(user.minBudget.toLocaleString('ru-RU'))} ₽`,
        `📊 Мин\\. совпадение: ${user.minMatchScore}%`,
        `🔔 Уведомления: ${esc(active)}`,
      ].join('\n'),
      { parse_mode: 'MarkdownV2' },
    );
  }

  // ── /pause ────────────────────────────────────────────────────────────────

  @Command('pause')
  async onPause(@Ctx() ctx: SceneCtx): Promise<void> {
    if (!ctx.from) return;
    await this.usersService.setActive(ctx.from.id, false);
    await ctx.reply(
      '⏸ Уведомления приостановлены\\. Используй /resume чтобы возобновить\\.',
      { parse_mode: 'MarkdownV2' },
    );
  }

  // ── /resume ───────────────────────────────────────────────────────────────

  @Command('resume')
  async onResume(@Ctx() ctx: SceneCtx): Promise<void> {
    if (!ctx.from) return;
    await this.usersService.setActive(ctx.from.id, true);
    await ctx.reply(
      '▶️ Уведомления возобновлены\\. Ищу подходящие заказы\\.',
      { parse_mode: 'MarkdownV2' },
    );
  }

  // ── /help ─────────────────────────────────────────────────────────────────

  @Command('help')
  async onHelp(@Ctx() ctx: SceneCtx): Promise<void> {
    await ctx.reply(
      [
        `📖 *Команды бота*`,
        ``,
        `/start — запуск и настройка профиля`,
        `/profile — посмотреть текущий профиль`,
        `/setup — изменить профиль`,
        `/pause — приостановить уведомления`,
        `/resume — возобновить уведомления`,
        `/help — это сообщение`,
      ].join('\n'),
      { parse_mode: 'MarkdownV2' },
    );
  }
}
