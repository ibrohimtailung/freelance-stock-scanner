import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Analysis } from './entities/analysis.entity';
import { JobsService } from './jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Analysis])],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
