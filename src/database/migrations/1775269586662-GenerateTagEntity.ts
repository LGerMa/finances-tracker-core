import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateTagEntity1775269586662 implements MigrationInterface {
    name = 'GenerateTagEntity1775269586662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#6B7280', CONSTRAINT "UQ_1d8718578ce96a09d1aa2237a14" UNIQUE ("user_id", "name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
