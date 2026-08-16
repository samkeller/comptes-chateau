import { MigrationInterface, QueryRunner } from "typeorm";

export class TruncateAccountLineRules1786869263708 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.clearTable("account_line_rule");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TRUNCATE ne peut pas être annulé.
    }

}
