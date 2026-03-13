import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';
import { Analysis } from '../jobs/entities/analysis.entity';
import { formatJobMessage } from './telegram.formatter';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
  ) {}

  async sendJobNotification(
    user: User,
    job: Job,
    analysis: Analysis,
    proposal: string,
  ): Promise<void> {
    const text = formatJobMessage(job, analysis, proposal);

    await this.bot.telegram.sendMessage(user.telegramId, text, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Открыть заказ на Kwork', url: job.url }],
        ],
      },
    });

    this.logger.log(`Sent notification to user ${user.telegramId} for job ${job.id}`);
  }

  async sendMessage(
    telegramId: number,
    text: string,
    parseMode: 'MarkdownV2' | 'HTML' = 'MarkdownV2',
  ): Promise<void> {
    await this.bot.telegram.sendMessage(telegramId, text, {
      parse_mode: parseMode,
      link_preview_options: { is_disabled: true },
    });
  }

  async sendPlain(telegramId: number, text: string): Promise<void> {
    await this.bot.telegram.sendMessage(telegramId, text);
  }
}
