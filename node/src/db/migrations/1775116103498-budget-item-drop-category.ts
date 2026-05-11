import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetItemDropCategory1775116103498 implements MigrationInterface {
    name = 'BudgetItemDropCategory1775116103498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_item" DROP COLUMN "category"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_item" ADD "category" character varying(120)`);
    }

}
