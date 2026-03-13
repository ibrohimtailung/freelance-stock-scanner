import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IPlatformScraper, ScrapedJob } from './interfaces/platform-scraper.interface';
import { KworkScraper } from './platforms/kwork.scraper';

/**
 * Registry + orchestrator for all platform scrapers.
 *
 * To add a new platform:
 *   1. Create `platforms/upwork.scraper.ts` implementing `IPlatformScraper`
 *   2. Add it as a provider in `ScraperModule`
 *   3. Inject it here and call `this.register(this.upworkScraper)` in onModuleInit
 */
@Injectable()
export class ScraperService implements OnModuleInit {
  private readonly logger = new Logger(ScraperService.name);
  private readonly scrapers = new Map<string, IPlatformScraper>();

  constructor(private readonly kworkScraper: KworkScraper) { }

  onModuleInit(): void {
    this.register(this.kworkScraper);
    // Future: this.register(this.upworkScraper);
    this.logger.log(`Registered scrapers: [${[...this.scrapers.keys()].join(', ')}]`);
  }

  private register(scraper: IPlatformScraper): void {
    this.scrapers.set(scraper.platform, scraper);
  }

  async scrapeAll(): Promise<ScrapedJob[]> {
    const results: ScrapedJob[] = [];

    for (const [platform, scraper] of this.scrapers) {
      try {
        this.logger.log(`Scraping: ${platform}`);
        const jobs = await scraper.scrapeJobs();
        this.logger.log(`${platform}: ${jobs.length} jobs returned`);
        results.push(...jobs);
      } catch (err) {
        this.logger.error(`Scrape failed [${platform}]`, (err as Error).message);
      }
    }

    return results;
  }

  async scrapeByPlatform(platform: string): Promise<ScrapedJob[]> {
    const scraper = this.scrapers.get(platform);
    if (!scraper) {
      this.logger.warn(`No scraper registered for: ${platform}`);
      return [];
    }
    return scraper.scrapeJobs();
  }

  getRegisteredPlatforms(): string[] {
    return [...this.scrapers.keys()];
  }
}
