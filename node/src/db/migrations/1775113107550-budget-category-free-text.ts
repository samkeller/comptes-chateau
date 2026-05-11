import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetCategoryFreeText1775113107550 implements MigrationInterface {
    name = 'BudgetCategoryFreeText1775113107550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_item" ALTER COLUMN "category" TYPE varchar(120) USING "category"::text`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."budget_item_category_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."budget_item_category_enum" AS ENUM('incompressible','compressible','epargne')`);
        await queryRunner.query(`ALTER TABLE "budget_item" ALTER COLUMN "category" TYPE "comptes_chateau"."budget_item_category_enum" USING "category"::text::"comptes_chateau"."budget_item_category_enum"`);
    }
}