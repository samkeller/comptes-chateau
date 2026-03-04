import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetItems1772618864319 implements MigrationInterface {
    name = 'BudgetItems1772618864319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "budget_item_category_enum" AS ENUM('incompressible', 'compressible', 'epargne')`);
        await queryRunner.query(`CREATE TABLE "budget_item" ("id" SERIAL NOT NULL, "category" "budget_item_category_enum" NOT NULL, "label" character varying(255) NOT NULL, "amount" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_28827d376580578abe27ada04bb" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "budget_item"`);
        await queryRunner.query(`DROP TYPE "budget_item_category_enum"`);
    }

}
