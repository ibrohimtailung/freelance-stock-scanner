import { Logger } from '@nestjs/common';
import { Wizard, WizardStep, On, Message } from 'nestjs-telegraf';
import { Ctx as TelegrafCtx } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { formatWelcomeMessage, formatProfileSummary } from '../telegram.formatter';

export const ONBOARDING_SCENE = 'ONBOARDING_SCENE';

/** Temporary state stored in the Telegraf session during the wizard */
interface OnboardingState {
  experience?: string;
  skills?: string[];
  jobPreferences?: string[];
  minBudget?: number;
}

type Ctx = Scenes.WizardContext & {
  wizard: Scenes.WizardContext['wizard'] & { state: OnboardingState };
};

@Wizard(ONBOARDING_SCENE)
export class OnboardingScene {
  private readonly logger = new Logger(OnboardingScene.name);

  constructor(private readonly usersService: UsersService) { }

  // ── Step 0: Enter scene → ask for experience ──────────────────────────────

  @WizardStep(0)
  async onEnter(ctx: Ctx): Promise<void> {
    const firstName = (ctx.from as { first_name?: string } | undefined)?.first_name ?? null;

    await ctx.reply(formatWelcomeMessage(firstName), { parse_mode: 'MarkdownV2' });
    await ctx.reply(
      '📌 *Шаг 1 из 4*\n\n*Опиши свой опыт работы*\n\n_Пример: 3 года frontend разработчик_',
      { parse_mode: 'MarkdownV2' },
    );

    await ctx.wizard.next();
  }

  // ── Step 1: Receive experience → ask for skills ───────────────────────────

  @WizardStep(1)
  @On('text')
  async onExperience(@Message('text') text: string, @TelegrafCtx() ctx: Ctx): Promise<void> {
    if (!text || text.trim().length < 2) {
      await ctx.reply('⚠️ Введи хотя бы пару слов об опыте.');
      return;
    }

    ctx.wizard.state.experience = text.trim();

    await ctx.reply(
      '🛠 *Шаг 2 из 4*\n\n*Перечисли навыки через запятую*\n\n_Пример: React, Next\\.js, TypeScript, Node\\.js_',
      { parse_mode: 'MarkdownV2' },
    );
    await ctx.wizard.next();
  }

  // ── Step 2: Receive skills → ask for job preferences ──────────────────────

  @WizardStep(2)
  @On('text')
  async onSkills(@Message('text') text: string, @TelegrafCtx() ctx: Ctx): Promise<void> {
    const skills = text.split(',').map((s) => s.trim()).filter(Boolean);

    if (skills.length === 0) {
      await ctx.reply('⚠️ Введи хотя бы один навык.');
      return;
    }

    ctx.wizard.state.skills = skills;

    await ctx.reply(
      '🎯 *Шаг 3 из 4*\n\n*Какие проекты тебя интересуют?*\n\n_Пример: frontend, React, лендинги_',
      { parse_mode: 'MarkdownV2' },
    );
    await ctx.wizard.next();
  }

  // ── Step 3: Receive preferences → ask for min budget ──────────────────────

  @WizardStep(3)
  @On('text')
  async onPreferences(@Message('text') text: string, @TelegrafCtx() ctx: Ctx): Promise<void> {
    const prefs = text.split(',').map((s) => s.trim()).filter(Boolean);
    ctx.wizard.state.jobPreferences = prefs;

    await ctx.reply(
      '💰 *Шаг 4 из 4*\n\n*Минимальный бюджет проекта \\(₽\\)*\n\n_Пример: 3000_',
      { parse_mode: 'MarkdownV2' },
    );
    await ctx.wizard.next();
  }

  // ── Step 4: Receive budget → save profile → leave scene ───────────────────

  @WizardStep(4)
  @On('text')
  async onBudget(@Message('text') text: string, @TelegrafCtx() ctx: Ctx): Promise<void> {
    const budget = parseInt(text.replace(/\D/g, ''), 10);

    if (isNaN(budget) || budget < 0) {
      await ctx.reply('⚠️ Введи корректную сумму, например: *3000*', { parse_mode: 'MarkdownV2' });
      return;
    }

    ctx.wizard.state.minBudget = budget;

    const from = ctx.from as { id: number; username?: string; first_name?: string } | undefined;
    if (!from) {
      await ctx.reply('❌ Не удалось определить пользователя.');
      return await ctx.scene.leave();
    }

    try {
      await this.usersService.upsert({
        telegramId: from.id,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        experience: ctx.wizard.state.experience,
        skills: ctx.wizard.state.skills ?? [],
        jobPreferences: ctx.wizard.state.jobPreferences ?? [],
        minBudget: budget,
        language: 'ru',
      });

      await this.usersService.completeOnboarding(from.id);

      const user = await this.usersService.findByTelegramId(from.id);
      if (user) {
        await ctx.reply(formatProfileSummary(user), { parse_mode: 'MarkdownV2' });
      }

      this.logger.log(`Onboarding complete: telegramId=${from.id}`);
    } catch (err) {
      this.logger.error('Failed to save user profile', err);
      await ctx.reply('❌ Ошибка сохранения. Попробуй /start ещё раз.');
    }

    await ctx.scene.leave();
  }
}
