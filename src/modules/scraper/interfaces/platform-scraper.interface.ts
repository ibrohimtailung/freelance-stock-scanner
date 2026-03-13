export interface ScrapedJob {
  title: string;
  description: string;
  budget: number | null;
  budgetCurrency: string;
  deadline: Date | null;
  applicantsCount: number;
  url: string;
  source: string;
  rawData: Record<string, unknown>;
}

/**
 * Every platform scraper must implement this interface.
 * Register new scrapers in ScraperService.onModuleInit().
 */
export interface IPlatformScraper {
  /** Matches the "source" field stored on the Job entity */
  readonly platform: string;

  scrapeJobs(): Promise<ScrapedJob[]>;
}
