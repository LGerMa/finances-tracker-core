import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateIncomeEntity1775275559941 implements MigrationInterface {
    name = 'GenerateIncomeEntity1775275559941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "income" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "type" character varying(50) NOT NULL, "description" text, "date" date NOT NULL, CONSTRAINT "PK_29a10f17b97568f70cee8586d58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "income_tags" ("income_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_5c4334098e1081773d314439291" PRIMARY KEY ("income_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_17f02a8635b304a80983ac91cb" ON "income_tags" ("income_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6bc0456b7bd555a50cf09faa6" ON "income_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "income" ADD CONSTRAINT "FK_934ccd95e5557152309f111df82" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "income_tags" ADD CONSTRAINT "FK_17f02a8635b304a80983ac91cb4" FOREIGN KEY ("income_id") REFERENCES "income"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "income_tags" ADD CONSTRAINT "FK_d6bc0456b7bd555a50cf09faa68" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "income_tags" DROP CONSTRAINT "FK_d6bc0456b7bd555a50cf09faa68"`);
        await queryRunner.query(`ALTER TABLE "income_tags" DROP CONSTRAINT "FK_17f02a8635b304a80983ac91cb4"`);
        await queryRunner.query(`ALTER TABLE "income" DROP CONSTRAINT "FK_934ccd95e5557152309f111df82"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6bc0456b7bd555a50cf09faa6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17f02a8635b304a80983ac91cb"`);
        await queryRunner.query(`DROP TABLE "income_tags"`);
        await queryRunner.query(`DROP TABLE "income"`);
    }

}
