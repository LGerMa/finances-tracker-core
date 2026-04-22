import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToEntities1775708473816 implements MigrationInterface {
    name = 'AddSoftDeleteToEntities1775708473816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "recurring_entries" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "income" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "recurring_entries" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deleted_at"`);
    }

}
