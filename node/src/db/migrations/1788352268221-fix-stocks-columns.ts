import { MigrationInterface, QueryRunner } from "typeorm";

export class FixStocksColumns1788352268221 implements MigrationInterface {
    name = 'FixStocksColumns1788352268221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_location" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "stock_location" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "deletedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "stock_location" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "stock_location" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
