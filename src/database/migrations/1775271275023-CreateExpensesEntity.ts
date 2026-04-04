import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExpensesEntity1775271275023 implements MigrationInterface {
    name = 'CreateExpensesEntity1775271275023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "payment_method" character varying(50) NOT NULL, "description" text, "date" date NOT NULL, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_tags" ("expense_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_d2006dcc715802ea59a4fd04435" PRIMARY KEY ("expense_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0a092156be61729db60d4da299" ON "expense_tags" ("expense_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dca8d34cffafad2bfa95c514aa" ON "expense_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_49a0ca239d34e74fdc4e0625a78" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_tags" ADD CONSTRAINT "FK_0a092156be61729db60d4da299b" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "expense_tags" ADD CONSTRAINT "FK_dca8d34cffafad2bfa95c514aa8" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expense_tags" DROP CONSTRAINT "FK_dca8d34cffafad2bfa95c514aa8"`);
        await queryRunner.query(`ALTER TABLE "expense_tags" DROP CONSTRAINT "FK_0a092156be61729db60d4da299b"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_49a0ca239d34e74fdc4e0625a78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dca8d34cffafad2bfa95c514aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a092156be61729db60d4da299"`);
        await queryRunner.query(`DROP TABLE "expense_tags"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
    }

}
