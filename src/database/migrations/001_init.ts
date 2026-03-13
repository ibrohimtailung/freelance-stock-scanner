import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"               UUID              NOT NULL DEFAULT gen_random_uuid(),
        "telegram_id"      BIGINT            NOT NULL,
        "username"         VARCHAR(100),
        "first_name"       VARCHAR(100),
        "experience"       TEXT,
        "skills"           TEXT[]            NOT NULL DEFAULT '{}',
        "job_preferences"  TEXT[]            NOT NULL DEFAULT '{}',
        "min_budget"       INTEGER           NOT NULL DEFAULT 0,
        "language"         VARCHAR(10)       NOT NULL DEFAULT 'ru',
        "min_match_score"  INTEGER           NOT NULL DEFAULT 60,
        "is_active"        BOOLEAN           NOT NULL DEFAULT TRUE,
        "is_onboarded"     BOOLEAN           NOT NULL DEFAULT FALSE,
        "onboarded_at"     TIMESTAMPTZ,
        "created_at"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_telegram_id" ON "users" ("telegram_id")
    `);

    // ── jobs ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id"               UUID              NOT NULL DEFAULT gen_random_uuid(),
        "url_hash"         VARCHAR(64)       NOT NULL,
        "title"            VARCHAR(500)      NOT NULL,
        "description"      TEXT              NOT NULL,
        "budget"           INTEGER,
        "budget_currency"  VARCHAR(10)       NOT NULL DEFAULT 'RUB',
        "deadline"         TIMESTAMPTZ,
        "applicants_count" INTEGER           NOT NULL DEFAULT 0,
        "source"           VARCHAR(50)       NOT NULL,
        "url"              TEXT              NOT NULL,
        "raw_data"         JSONB,
        "scraped_at"       TIMESTAMPTZ       NOT NULL,
        "created_at"       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_jobs_url_hash" ON "jobs" ("url_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_jobs_source" ON "jobs" ("source")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_jobs_created_at" ON "jobs" ("created_at" DESC)
    `);

    // ── analyses ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "analyses" (
        "id"                UUID              NOT NULL DEFAULT gen_random_uuid(),
        "job_id"            UUID              NOT NULL,
        "user_id"           UUID              NOT NULL,
        "match_score"       INTEGER           NOT NULL,
        "reason"            TEXT              NOT NULL,
        "difficulty"        VARCHAR(20)       NOT NULL,
        "urgency"           VARCHAR(20)       NOT NULL,
        "competition_level" VARCHAR(20)       NOT NULL,
        "proposal_text"     TEXT,
        "sent_to_telegram"  BOOLEAN           NOT NULL DEFAULT FALSE,
        "model_used"        VARCHAR(100),
        "created_at"        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_analyses"            PRIMARY KEY ("id"),
        CONSTRAINT "FK_analyses_job"        FOREIGN KEY ("job_id")  REFERENCES "jobs"("id")  ON DELETE CASCADE,
        CONSTRAINT "FK_analyses_user"       FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_analyses_job_user"   UNIQUE ("job_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analyses_user_id" ON "analyses" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analyses_sent" ON "analyses" ("sent_to_telegram")
        WHERE sent_to_telegram = FALSE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analyses_match_score" ON "analyses" ("match_score" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analyses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
