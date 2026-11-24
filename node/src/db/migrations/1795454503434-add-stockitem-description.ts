import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockitemDescription1795454503434 implements MigrationInterface {
    name = 'AddStockitemDescription1795454503434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_item" ADD "description" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_item" DROP COLUMN "description"`);
    }

}
