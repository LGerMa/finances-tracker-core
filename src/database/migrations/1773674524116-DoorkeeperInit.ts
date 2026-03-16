import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class DoorkeeperInit1773674524116 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "auth_users",
        columns: [
          { name: "id",            type: "uuid",      isPrimary: true, generationStrategy: "uuid", default: "gen_random_uuid()" },
          { name: "email",         type: "varchar",   isUnique: true,  isNullable: false },
          { name: "password_hash", type: "varchar",   isNullable: false },
          { name: "is_active",     type: "boolean",   default: true },
          { name: "created_at",    type: "timestamp", default: "now()" },
          { name: "updated_at",    type: "timestamp", default: "now()" },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "auth_sessions",
        columns: [
          { name: "id",            type: "uuid",      isPrimary: true, generationStrategy: "uuid", default: "gen_random_uuid()" },
          { name: "user_id",       type: "uuid",      isNullable: false },
          { name: "access_token",  type: "varchar",   isNullable: false },
          { name: "refresh_token", type: "varchar",   isNullable: false, isUnique: true },
          { name: "ip_address",    type: "varchar",   isNullable: true },
          { name: "user_agent",    type: "varchar",   isNullable: true },
          { name: "device_type",   type: "varchar",   isNullable: true },
          { name: "device_name",   type: "varchar",   isNullable: true },
          { name: "browser_name",  type: "varchar",   isNullable: true },
          { name: "os_name",       type: "varchar",   isNullable: true },
          { name: "os_version",    type: "varchar",   isNullable: true },
          { name: "created_at",    type: "timestamp", default: "now()" },
          { name: "last_used_at",  type: "timestamp", isNullable: true },
          { name: "expires_at",    type: "timestamp", isNullable: false },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "auth_sessions",
      new TableIndex({ name: "IDX_auth_sessions_refresh_token", columnNames: ["refresh_token"] }),
    );

    await queryRunner.createForeignKey(
      "auth_sessions",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "auth_users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("auth_sessions", true);
    await queryRunner.dropTable("auth_users", true);
  }
}
