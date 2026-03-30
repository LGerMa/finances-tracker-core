import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntity1774842962542 implements MigrationInterface {
    name = 'UserEntity1774842962542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "email_verified_at" TIMESTAMP, "phone_number" character varying, "area_code" character varying, "phone_verified_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "name" character varying, "lastname" character varying, "avatar_url" character varying, "bio" text, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
