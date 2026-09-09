import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentSourceToRecurringTable1788749403790 implements MigrationInterface {
    name = 'AddPaymentSourceToRecurringTable1788749403790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_entries" ADD "payment_source_id" uuid`);
        await queryRunner.query(`ALTER TABLE "recurring_entries" ADD CONSTRAINT "FK_02b920ca48cb4920b2786abd595" FOREIGN KEY ("payment_source_id") REFERENCES "payment_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_entries" DROP CONSTRAINT "FK_02b920ca48cb4920b2786abd595"`);
        await queryRunner.query(`ALTER TABLE "recurring_entries" DROP COLUMN "payment_source_id"`);
    }

}
