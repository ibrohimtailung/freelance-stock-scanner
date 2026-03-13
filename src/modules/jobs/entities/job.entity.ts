import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Analysis } from './analysis.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** SHA-256 hash of job URL — dedup key */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, name: 'url_hash' })
  urlHash: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer', nullable: true })
  budget: number | null;

  @Column({ type: 'varchar', length: 10, default: 'RUB', name: 'budget_currency' })
  budgetCurrency: string;

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date | null;

  @Column({ type: 'integer', default: 0, name: 'applicants_count' })
  applicantsCount: number;

  /** "kwork" | "upwork" | ... */
  @Column({ type: 'varchar', length: 50 })
  source: string;

  @Column({ type: 'text' })
  url: string;

  /** Raw scraped payload — kept for debugging and re-analysis */
  @Column({ type: 'jsonb', nullable: true, name: 'raw_data' })
  rawData: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', name: 'scraped_at' })
  scrapedAt: Date;

  @OneToMany(() => Analysis, (analysis) => analysis.job)
  analyses: Analysis[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
