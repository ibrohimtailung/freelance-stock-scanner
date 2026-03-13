import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { Analysis } from '../modules/jobs/entities/analysis.entity';

config(); // load .env

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [User, Job, Analysis],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
});
