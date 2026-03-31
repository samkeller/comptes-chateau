import { MigrationInterface, QueryRunner } from "typeorm";

export class AccountScopePosteAndGlobalNature1774967236142 implements MigrationInterface {
    name = 'AccountScopePosteAndGlobalNature1774967236142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_poste" ADD "account_id" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" DROP CONSTRAINT "UQ_8ca51af84b8a444b105673e6907"`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" ADD CONSTRAINT "UQ_account_line_poste_account_label" UNIQUE ("account_id", "label")`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" ADD CONSTRAINT "FK_90ddc4ecd93226e4dc846c70e67" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_line_poste" DROP CONSTRAINT "FK_90ddc4ecd93226e4dc846c70e67"`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" DROP CONSTRAINT "UQ_account_line_poste_account_label"`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" ADD CONSTRAINT "UQ_8ca51af84b8a444b105673e6907" UNIQUE ("label")`);
        await queryRunner.query(`ALTER TABLE "account_line_poste" DROP COLUMN "account_id"`);
    }

}
