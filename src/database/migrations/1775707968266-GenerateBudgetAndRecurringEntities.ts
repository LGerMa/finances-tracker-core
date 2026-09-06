import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateBudgetAndRecurringEntities1775707968266 implements MigrationInterface {
  name = 'GenerateBudgetAndRecurringEntities1775707968266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recurring_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "entry_type" character varying(10) NOT NULL, "amount" numeric(12,2) NOT NULL, "description" text, "payment_method" character varying(50), "income_type" character varying(50), "frequency" character varying(20) NOT NULL, "day_of_month" integer, "day_of_week" integer, "next_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_1be4b958b696c5dd8f7d2dcf23a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "tag_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, CONSTRAINT "UQ_5794ddb3b69371f303c3a4a1d7a" UNIQUE ("user_id", "tag_id"), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_entry_tags" ("recurring_entry_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_9a51b7de5e0d24d356c5e07e52e" PRIMARY KEY ("recurring_entry_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60da31cf952a105ad9a352b9f4" ON "recurring_entry_tags" ("recurring_entry_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cdaa7586291f7befed73e3c7de" ON "recurring_entry_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_entries" ADD CONSTRAINT "FK_ed0a70158fc98dfc477783308b8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_93b4b76cd54df5b7fee81eb761a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_entry_tags" ADD CONSTRAINT "FK_60da31cf952a105ad9a352b9f45" FOREIGN KEY ("recurring_entry_id") REFERENCES "recurring_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_entry_tags" ADD CONSTRAINT "FK_cdaa7586291f7befed73e3c7de5" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recurring_entry_tags" DROP CONSTRAINT "FK_cdaa7586291f7befed73e3c7de5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_entry_tags" DROP CONSTRAINT "FK_60da31cf952a105ad9a352b9f45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_93b4b76cd54df5b7fee81eb761a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_entries" DROP CONSTRAINT "FK_ed0a70158fc98dfc477783308b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cdaa7586291f7befed73e3c7de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_60da31cf952a105ad9a352b9f4"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_entry_tags"`);
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TABLE "recurring_entries"`);
  }
}
