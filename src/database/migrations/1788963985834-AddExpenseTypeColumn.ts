import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpenseTypeColumn1788963985834 implements MigrationInterface {
    name = 'AddExpenseTypeColumn1788963985834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "type" character varying(20) NOT NULL DEFAULT 'variable'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "type"`);
    }

}
