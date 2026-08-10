import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountLineRuleAccountPatternUnique1786207089654 implements MigrationInterface {
    name = 'AddAccountLineRuleAccountPatternUnique1786207089654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP CONSTRAINT "UQ_account_line_rule_pattern"`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD CONSTRAINT "UQ_account_line_rule_account_pattern" UNIQUE ("account_id", "pattern")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_rule" DROP CONSTRAINT "UQ_account_line_rule_account_pattern"`);
        await queryRunner.query(`ALTER TABLE "account_line_rule" ADD CONSTRAINT "UQ_account_line_rule_pattern" UNIQUE ("pattern")`);
    }

}
