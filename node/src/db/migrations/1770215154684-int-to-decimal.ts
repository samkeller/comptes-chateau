import { MigrationInterface, QueryRunner } from "typeorm";

export class IntToDecimal1770215154684 implements MigrationInterface {
    name = 'IntToDecimal1770215154684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "solde" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "account_line" ALTER COLUMN "solde" TYPE numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" ALTER COLUMN "solde" TYPE integer USING ROUND("solde"::numeric)::integer`);
        await queryRunner.query(`ALTER TABLE "recurring_expense" ALTER COLUMN "solde" TYPE integer USING ROUND("solde"::numeric)::integer`);
    }

}
