import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Analysis } from '../../jobs/entities/analysis.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', name: 'telegram_id' })
  telegramId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName: string | null;

  /** Free-text: "3 years frontend developer" */
  @Column({ type: 'text', nullable: true })
  experience: string | null;

  /** ["React", "Next.js", "TypeScript"] */
  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  /** ["frontend", "React"] */
  @Column({ type: 'text', array: true, default: [], name: 'job_preferences' })
  jobPreferences: string[];

  /** Minimum acceptable budget in RUB */
  @Column({ type: 'integer', default: 0, name: 'min_budget' })
  minBudget: number;

  /** "ru" | "en" */
  @Column({ type: 'varchar', length: 10, default: 'ru' })
  language: string;

  /** Minimum match_score (0–100) to trigger a Telegram notification */
  @Column({ type: 'integer', default: 60, name: 'min_match_score' })
  minMatchScore: number;

  /** Whether the bot should send notifications to this user */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /** Whether the onboarding wizard has been completed */
  @Column({ type: 'boolean', default: false, name: 'is_onboarded' })
  isOnboarded: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'onboarded_at' })
  onboardedAt: Date | null;

  @OneToMany(() => Analysis, (analysis) => analysis.user)
  analyses: Analysis[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
