import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanquepostaleImportAccountLineLink1788967020848 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD "accountLineId" integer`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD CONSTRAINT "UQ_banque_postale_operation_import_account_line_id" UNIQUE ("accountLineId")`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" ADD CONSTRAINT "FK_banque_postale_operation_import_account_line_id" FOREIGN KEY ("accountLineId") REFERENCES "account_line"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP CONSTRAINT "FK_banque_postale_operation_import_account_line_id"`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP CONSTRAINT "UQ_banque_postale_operation_import_account_line_id"`);
        await queryRunner.query(`ALTER TABLE "banque_postale_operation_import" DROP COLUMN "accountLineId"`);
    }

}
