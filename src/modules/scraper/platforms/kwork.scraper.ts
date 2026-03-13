import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page, Locator } from 'playwright';
import {
  IPlatformScraper,
  ScrapedJob,
} from '../interfaces/platform-scraper.interface';

@Injectable()
export class KworkScraper implements IPlatformScraper {
  readonly platform = 'kwork';

  private readonly logger = new Logger(KworkScraper.name);
  private readonly BASE_URL = 'https://kwork.ru/projects';
  // Dev mode uchun kutish vaqtini qisqa ushlaymiz, shunda tezda xato ko'rinadi
  private readonly TIMEOUT = 10_000;

  // ─── Public ──────────────────────────────────────────────────────────────

  async scrapeJobs(): Promise<ScrapedJob[]> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });
      await page.setViewportSize({ width: 1280, height: 800 });

      await page.goto(this.BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: this.TIMEOUT,
      });

      // Wait for at least one job card before proceeding
      await page.waitForSelector('.wants-card, .want-card', { timeout: this.TIMEOUT });

      const jobs = await this.extractJobs(page);
      this.logger.log(`Kwork: scraped ${jobs.length} jobs`);
      return jobs;

    } catch (err) {
      this.logger.error('Kwork scrape failed', (err as Error).message);
      return [];
    } finally {
      if (browser) await browser.close();
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async extractJobs(page: Page): Promise<ScrapedJob[]> {
    const cards: Locator[] = await page.locator('.wants-card, .want-card').all();
    const jobs: ScrapedJob[] = [];

    for (const card of cards) {
      try {
        const job = await this.parseCard(card);
        if (job) {
          jobs.push(job);
        }
      } catch (err) {
        this.logger.warn('Failed to parse a job card — skipping', (err as Error).message);
      }
    }

    return jobs;
  }

  private async parseCard(card: Locator): Promise<ScrapedJob | null> {
    // Title + URL
    const titleEl = card.locator('.wants-card__header-title a, .want-card__header-title a').first();
    const title = (await titleEl.textContent())?.trim() ?? '';
    if (!title) return null;

    const href = await titleEl.getAttribute('href');
    if (!href) return null;
    const url = href.startsWith('http') ? href : `https://kwork.ru${href}`;
    // Description
    const description = (
      await card
        .locator('.wants-card__description-text, .want-card__description-text')
        .first()
        .textContent()
        .catch(() => '')
    )?.trim() ?? '';
    // Budget  — "до 5 000 ₽" / "от 1 000 ₽" / "5 000 ₽"
    const budgetText = (
      await card
        .locator('.wants-card__price, .want-card__price')
        .first()
        .textContent()
        .catch(() => '')
    )?.trim() ?? '';
    const budget = this.parseBudget(budgetText);

    // Deadline — "осталось 3 дня" etc.
    const deadlineText = (
      await card
        .locator('.wants-card__informers-deadline span, .want-card__informers-deadline span, .wants-card__informers-row span, .want-card__informers-row span')
        .first()
        .textContent()
        .catch(() => '')
    )?.trim() ?? '';
    const deadline = this.parseDeadline(deadlineText);

    // Applicants count
    // const applicantsText = (
    //   await card
    //     .locator('.wants-card__offers-count, .want-card__offers-count, , .wants-card__informers-row span, .want-card__informers-row span')
    //     .first()
    //     .textContent()
    //     .catch(() => '0')
    // )?.trim() ?? '0';
    // const applicantsCount = parseInt(applicantsText.replace(/\D/g, ''), 10) || 0;

    return {
      title,
      description,
      budget,
      budgetCurrency: 'RUB',
      deadline,
      applicantsCount: 0,
      url,
      source: this.platform,
      rawData: { budgetText, deadlineText, applicantsText: "" },
    };
  }

  /**
   * Parses Kwork budget strings.
   * Examples: "до 5 000 ₽", "от 1 200 ₽", "15 000 ₽"
   */
  private parseBudget(text: string): number | null {
    if (!text) return null;
    // Remove all non-digit characters except spaces, collapse spaces, parse
    const digits = text.replace(/[^\d\s]/g, '').replace(/\s+/g, '').trim();
    const num = parseInt(digits, 10);
    return isNaN(num) || num === 0 ? null : num;
  }

  /**
   * Parses Kwork relative deadline strings into absolute Date objects.
   * Examples: "осталось 3 дня" | "осталось 5 часов" | "1 неделя"
   */
  private parseDeadline(text: string): Date | null {
    if (!text) return null;

    const now = Date.now();
    const lower = text.toLowerCase();

    const days = lower.match(/(\d+)\s*(?:д)/);
    if (days) return new Date(now + parseInt(days[1], 10) * 86_400_000);

    const hours = lower.match(/(\d+)\s*(?:ч)/);
    if (hours) return new Date(now + parseInt(hours[1], 10) * 3_600_000);

    const weeks = lower.match(/(\d+)\s*(?:н)/);
    if (weeks) return new Date(now + parseInt(weeks[1], 10) * 7 * 86_400_000);

    const months = lower.match(/(\d+)\s*(?:м)/);
    if (months) return new Date(now + parseInt(months[1], 10) * 30 * 86_400_000);

    return null;
  }
}
