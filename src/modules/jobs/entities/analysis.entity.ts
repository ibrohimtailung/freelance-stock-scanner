import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from '../../users/entities/user.entity';

export type DifficultyLevel = 'low' | 'medium' | 'high';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type CompetitionLevel = 'low' | 'medium' | 'high';

@Entity('analyses')
@Unique(['jobId', 'userId'])
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Job, (job) => job.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => User, (user) => user.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** AI relevance score: 0–100 */
  @Column({ type: 'integer', name: 'match_score' })
  matchScore: number;

  /** Human-readable explanation from AI */
  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 20 })
  difficulty: DifficultyLevel;

  @Column({ type: 'varchar', length: 20 })
  urgency: UrgencyLevel;

  @Column({ type: 'varchar', length: 20, name: 'competition_level' })
  competitionLevel: CompetitionLevel;

  /** Generated Russian proposal text */
  @Column({ type: 'text', nullable: true, name: 'proposal_text' })
  proposalText: string | null;

  /** Has the Telegram message been sent for this analysis? */
  @Column({ type: 'boolean', default: false, name: 'sent_to_telegram' })
  sentToTelegram: boolean;

  /** Which AI model produced this analysis */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'model_used' })
  modelUsed: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
