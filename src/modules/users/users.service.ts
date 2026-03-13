import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface UpsertUserDto {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  experience?: string;
  skills?: string[];
  jobPreferences?: string[];
  minBudget?: number;
  language?: string;
  minMatchScore?: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { telegramId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findAllActive(): Promise<User[]> {
    return this.usersRepo.find({
      where: { isActive: true, isOnboarded: true },
    });
  }

  async upsert(dto: UpsertUserDto): Promise<User> {
    let user = await this.findByTelegramId(dto.telegramId);

    if (!user) {
      user = this.usersRepo.create({
        telegramId: dto.telegramId,
        username: dto.username ?? null,
        firstName: dto.firstName ?? null,
      });
      this.logger.log(`Creating new user telegramId=${dto.telegramId}`);
    }

    if (dto.experience !== undefined)    user.experience    = dto.experience;
    if (dto.skills !== undefined)        user.skills        = dto.skills;
    if (dto.jobPreferences !== undefined) user.jobPreferences = dto.jobPreferences;
    if (dto.minBudget !== undefined)     user.minBudget     = dto.minBudget;
    if (dto.language !== undefined)      user.language      = dto.language;
    if (dto.minMatchScore !== undefined) user.minMatchScore = dto.minMatchScore;
    if (dto.username !== undefined)      user.username      = dto.username ?? null;
    if (dto.firstName !== undefined)     user.firstName     = dto.firstName ?? null;

    return this.usersRepo.save(user);
  }

  async completeOnboarding(telegramId: number): Promise<User> {
    const user = await this.findByTelegramId(telegramId);
    if (!user) throw new NotFoundException(`User not found: ${telegramId}`);

    user.isOnboarded = true;
    user.onboardedAt = new Date();
    return this.usersRepo.save(user);
  }

  async setActive(telegramId: number, isActive: boolean): Promise<void> {
    await this.usersRepo.update({ telegramId }, { isActive });
    this.logger.log(`User ${telegramId} isActive=${isActive}`);
  }
}
