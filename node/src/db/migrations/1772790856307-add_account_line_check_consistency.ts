import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountLineCheckConsistency1772790856307 implements MigrationInterface {
    name = 'AddAccountLineCheckConsistency1772790856307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "CHK_e2a41dcc62ce7346029b78f83d" CHECK ((("isChecked" = true AND "dateValeur" IS NOT NULL) OR ("isChecked" = false AND "dateValeur" IS NULL)))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "CHK_e2a41dcc62ce7346029b78f83d"`);
    }

}
