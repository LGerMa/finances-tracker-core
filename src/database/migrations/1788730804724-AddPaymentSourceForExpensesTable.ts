import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentSourceForExpensesTable1788730804724 implements MigrationInterface {
    name = 'AddPaymentSourceForExpensesTable1788730804724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payment_sources" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "alias" character varying(100) NOT NULL, "payment_method" character varying(50), "color" character varying(7) NOT NULL DEFAULT '#6B7280', CONSTRAINT "PK_2848e20fe19c056a000c6b24af8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_payment_sources_user_alias_active" ON "payment_sources" ("user_id", "alias") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "payment_source_id" uuid`);
        await queryRunner.query(`ALTER TABLE "payment_sources" ADD CONSTRAINT "FK_8f5e704b9d8f130ccf7bfdfa9a6" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_23062e054b79770d50f8d575376" FOREIGN KEY ("payment_source_id") REFERENCES "payment_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_23062e054b79770d50f8d575376"`);
        await queryRunner.query(`ALTER TABLE "payment_sources" DROP CONSTRAINT "FK_8f5e704b9d8f130ccf7bfdfa9a6"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "payment_source_id"`);
        await queryRunner.query(`DROP INDEX "public"."ux_payment_sources_user_alias_active"`);
        await queryRunner.query(`DROP TABLE "payment_sources"`);
    }

}
