import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetItemAddPoste1775110948689 implements MigrationInterface {
    name = 'BudgetItemAddPoste1775110948689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_item" ADD "poste_id" integer`);
        await queryRunner.query(`ALTER TABLE "budget_item" ADD CONSTRAINT "FK_521d69cdd76d742358dcba22bf9" FOREIGN KEY ("poste_id") REFERENCES "account_line_poste"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_item" DROP CONSTRAINT "FK_521d69cdd76d742358dcba22bf9"`);
        await queryRunner.query(`ALTER TABLE "budget_item" DROP COLUMN "poste_id"`);
    }

}
