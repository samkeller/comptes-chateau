import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAcountLineRuleLabel1786871829608 implements MigrationInterface {
    name = 'AddAcountLineRuleLabel1786871829608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.clearTable("account_line_rule");
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD "label" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP COLUMN "label"`);
    }

}
