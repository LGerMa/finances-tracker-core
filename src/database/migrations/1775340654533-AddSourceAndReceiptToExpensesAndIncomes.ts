import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSourceAndReceiptToExpensesAndIncomes1775340654533 implements MigrationInterface {
    name = 'AddSourceAndReceiptToExpensesAndIncomes1775340654533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "income" ADD "source" character varying(50) NOT NULL DEFAULT 'web'`);
        await queryRunner.query(`ALTER TABLE "income" ADD "receipt_url" text`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "source" character varying(50) NOT NULL DEFAULT 'web'`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "receipt_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "receipt_url"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "receipt_url"`);
        await queryRunner.query(`ALTER TABLE "income" DROP COLUMN "source"`);
    }

}
