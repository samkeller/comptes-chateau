import { MigrationInterface, QueryRunner } from "typeorm";

export class AccountLineTransferPairConsistency1788705190746 implements MigrationInterface {
    name = 'AccountLineTransferPairConsistency1788705190746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" ADD CONSTRAINT "CHK_6ebc988c53e6e8a736405dc46d" CHECK ((("transfer_group_id" IS NOT NULL AND "target_account_id" IS NOT NULL) OR ("transfer_group_id" IS NULL AND "target_account_id" IS NULL)))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line" DROP CONSTRAINT "CHK_6ebc988c53e6e8a736405dc46d"`);
    }

}
