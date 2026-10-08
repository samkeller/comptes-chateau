import { MigrationInterface, QueryRunner } from "typeorm";

export class StocksOffProductsAndBrand1791450850720 implements MigrationInterface {
    name = 'StocksOffProductsAndBrand1791450850720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."open_food_facts_product_status_enum" AS ENUM('found', 'not_found')`);
        await queryRunner.query(`CREATE TABLE "open_food_facts_product" ("barcode" character varying(14) NOT NULL, "status" "comptes_chateau"."open_food_facts_product_status_enum" NOT NULL, "product" jsonb, "fetchedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ccc1fe3e62d2d5780244d256e1d" PRIMARY KEY ("barcode"))`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."open_food_facts_api_call_trigger_enum" AS ENUM('lookup', 'backfill')`);
        await queryRunner.query(`CREATE TYPE "comptes_chateau"."open_food_facts_api_call_outcome_enum" AS ENUM('found', 'not_found', 'http_error', 'network_error', 'rate_limited')`);
        await queryRunner.query(`CREATE TABLE "open_food_facts_api_call" ("id" SERIAL NOT NULL, "barcode" character varying(14) NOT NULL, "trigger" "comptes_chateau"."open_food_facts_api_call_trigger_enum" NOT NULL, "outcome" "comptes_chateau"."open_food_facts_api_call_outcome_enum" NOT NULL, "httpStatus" integer, "durationMs" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_34de2918d2ada4a5145a7e19ae9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f0f36cc224174f574353879ccb" ON "open_food_facts_api_call" ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "brand" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "brand"`);
        await queryRunner.query(`DROP INDEX "comptes_chateau"."IDX_f0f36cc224174f574353879ccb"`);
        await queryRunner.query(`DROP TABLE "open_food_facts_api_call"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."open_food_facts_api_call_outcome_enum"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."open_food_facts_api_call_trigger_enum"`);
        await queryRunner.query(`DROP TABLE "open_food_facts_product"`);
        await queryRunner.query(`DROP TYPE "comptes_chateau"."open_food_facts_product_status_enum"`);
    }

}
