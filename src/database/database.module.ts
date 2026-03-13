import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { Analysis } from '../modules/jobs/entities/analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        entities: [User, Job, Analysis],
        // In development, auto-sync creates tables automatically.
        // In production, use migrations (migration:run).
        synchronize: config.get<string>('nodeEnv') !== 'production',
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        migrationsRun: config.get<string>('nodeEnv') === 'production',
        logging: config.get<string>('nodeEnv') === 'development',
        ssl:
          config.get<string>('nodeEnv') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
          max: 20, // connection pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
