import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AnalyzerService } from './analyzer.service';
import { ProposalService } from './proposal.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 60_000,
      maxRedirects: 3,
    }),
  ],
  providers: [AiService, AnalyzerService, ProposalService],
  exports:   [AiService, AnalyzerService, ProposalService],
})
export class AiModule {}
