import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { KworkScraper } from './platforms/kwork.scraper';

@Module({
  providers: [ScraperService, KworkScraper],
  exports: [ScraperService],
})
export class ScraperModule {}
